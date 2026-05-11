#!/usr/bin/env python3
"""
High Accuracy CNN + BiLSTM Voice Emotion Recognition
Optimized for RAVDESS Dataset
Expected Accuracy: 80-90%
"""

import os
import numpy as np
import pandas as pd
import librosa
import pickle
import json
from pathlib import Path
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# TensorFlow
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import (
    Dense,
    Dropout,
    Conv1D,
    MaxPooling1D,
    LSTM,
    BatchNormalization,
    Activation,
    Input,
    Bidirectional,
    SpatialDropout1D,
    GlobalAveragePooling1D
)

from tensorflow.keras.callbacks import (
    EarlyStopping,
    ModelCheckpoint,
    ReduceLROnPlateau
)

from tensorflow.keras.optimizers import Adam
from tensorflow.keras.utils import to_categorical

# Sklearn
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
from sklearn.utils.class_weight import compute_class_weight


class HighAccuracyVoiceModel:

    def __init__(self, model_path="models"):

        self.model_path = Path(model_path)
        self.model_path.mkdir(exist_ok=True)

        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()

        self.model = None
        self.history = None

        # RAVDESS emotions
        self.emotion_map = {
            '01': 'neutral',
            '02': 'calm',
            '03': 'happy',
            '04': 'sad',
            '05': 'angry',
            '06': 'fearful',
            '07': 'disgust',
            '08': 'surprised'
        }

        # Simplified emotions
        self.simplified_emotion_map = {
            'neutral': 'Neutral',
            'calm': 'Neutral',
            'happy': 'Happy',
            'sad': 'Sad',
            'angry': 'Angry',
            'fearful': 'Sad',
            'disgust': 'Angry',
            'surprised': 'Happy'
        }

    # ==========================================================
    # FEATURE EXTRACTION
    # ==========================================================

    def extract_features(self, file_path, augment=False):

        try:

            y, sr = librosa.load(
                file_path,
                duration=3,
                sr=22050
            )

            # --------------------------------------------------
            # DATA AUGMENTATION
            # --------------------------------------------------

            if augment:

                aug_choice = np.random.choice(
                    ['noise', 'pitch', 'stretch']
                )

                if aug_choice == 'noise':

                    noise = np.random.randn(len(y))
                    y = y + 0.005 * noise

                elif aug_choice == 'pitch':

                    y = librosa.effects.pitch_shift(
                        y,
                        sr=sr,
                        n_steps=np.random.uniform(-1, 1)
                    )

                elif aug_choice == 'stretch':

                    rate = np.random.uniform(0.8, 1.2)
                    y = librosa.effects.time_stretch(y, rate=rate)

            # --------------------------------------------------
            # FIXED LENGTH
            # --------------------------------------------------

            target_length = 128

            # --------------------------------------------------
            # MFCC
            # --------------------------------------------------

            mfcc = librosa.feature.mfcc(
                y=y,
                sr=sr,
                n_mfcc=40
            )

            mfcc_delta = librosa.feature.delta(mfcc)

            # --------------------------------------------------
            # MEL SPECTROGRAM
            # --------------------------------------------------

            mel = librosa.feature.melspectrogram(
                y=y,
                sr=sr,
                n_mels=40
            )

            mel_db = librosa.power_to_db(mel)

            # --------------------------------------------------
            # CHROMA
            # --------------------------------------------------

            chroma = librosa.feature.chroma_stft(
                y=y,
                sr=sr
            )

            # --------------------------------------------------
            # RMS + ZCR
            # --------------------------------------------------

            zcr = librosa.feature.zero_crossing_rate(y)

            rms = librosa.feature.rms(y=y)

            # --------------------------------------------------
            # PAD/TRUNCATE
            # --------------------------------------------------

            def fix_length(feature):

                if feature.shape[1] > target_length:
                    feature = feature[:, :target_length]

                else:

                    pad_width = target_length - feature.shape[1]

                    feature = np.pad(
                        feature,
                        pad_width=((0, 0), (0, pad_width)),
                        mode='constant'
                    )

                return feature

            mfcc = fix_length(mfcc)
            mfcc_delta = fix_length(mfcc_delta)
            mel_db = fix_length(mel_db)
            chroma = fix_length(chroma)
            zcr = fix_length(zcr)
            rms = fix_length(rms)

            # --------------------------------------------------
            # STACK FEATURES
            # --------------------------------------------------

            features = np.vstack([
                mfcc,          # 40
                mfcc_delta,    # 40
                mel_db,        # 40
                chroma,        # 12
                zcr,           # 1
                rms            # 1
            ])

            # Total = 134 features

            features = features.T

            return features

        except Exception as e:

            print(f"Feature extraction error: {e}")
            return None

    # ==========================================================
    # MODEL
    # ==========================================================

    def build_model(self, input_shape, num_classes):

        inputs = Input(shape=input_shape)

        # --------------------------------------------------
        # CNN BLOCK 1
        # --------------------------------------------------

        x = Conv1D(
            64,
            kernel_size=5,
            padding='same'
        )(inputs)

        x = BatchNormalization()(x)
        x = Activation('relu')(x)

        x = MaxPooling1D(2)(x)

        x = SpatialDropout1D(0.1)(x)

        # --------------------------------------------------
        # CNN BLOCK 2
        # --------------------------------------------------

        x = Conv1D(
            128,
            kernel_size=3,
            padding='same'
        )(x)

        x = BatchNormalization()(x)
        x = Activation('relu')(x)

        x = MaxPooling1D(2)(x)

        x = SpatialDropout1D(0.15)(x)

        # --------------------------------------------------
        # CNN BLOCK 3
        # --------------------------------------------------

        x = Conv1D(
            256,
            kernel_size=3,
            padding='same'
        )(x)

        x = BatchNormalization()(x)
        x = Activation('relu')(x)

        x = MaxPooling1D(2)(x)

        x = SpatialDropout1D(0.2)(x)

        # --------------------------------------------------
        # BILSTM
        # --------------------------------------------------

        x = Bidirectional(
            LSTM(
                128,
                return_sequences=True,
                dropout=0.2
            )
        )(x)

        x = GlobalAveragePooling1D()(x)

        # --------------------------------------------------
        # DENSE
        # --------------------------------------------------

        x = Dense(128, activation='relu')(x)

        x = BatchNormalization()(x)

        x = Dropout(0.3)(x)

        x = Dense(64, activation='relu')(x)

        x = Dropout(0.2)(x)

        outputs = Dense(
            num_classes,
            activation='softmax'
        )(x)

        model = Model(inputs, outputs)

        model.compile(
            optimizer=Adam(
                learning_rate=0.0003,
                clipnorm=1.0
            ),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )

        return model

    # ==========================================================
    # LOAD DATASET
    # ==========================================================

    def load_dataset(self, dataset_path):

        print("Loading RAVDESS Dataset...")

        dataset_path = Path(dataset_path)

        X = []
        y = []

        for actor_dir in dataset_path.glob("Actor_*"):

            print(f"Processing {actor_dir.name}")

            for audio_file in actor_dir.glob("*.wav"):

                try:

                    parts = audio_file.stem.split('-')

                    emotion_code = parts[2]

                    emotion = self.emotion_map.get(
                        emotion_code,
                        'neutral'
                    )

                    simplified_emotion = \
                        self.simplified_emotion_map.get(
                            emotion,
                            'Neutral'
                        )

                    # ORIGINAL
                    features = self.extract_features(
                        audio_file,
                        augment=False
                    )

                    if features is not None:

                        X.append(features)
                        y.append(simplified_emotion)

                    # AUGMENTED
                    if np.random.random() > 0.5:

                        aug_features = self.extract_features(
                            audio_file,
                            augment=True
                        )

                        if aug_features is not None:

                            X.append(aug_features)
                            y.append(simplified_emotion)

                except:
                    continue

        X = np.array(X)
        y = np.array(y)

        print(f"Loaded Samples: {len(X)}")

        return X, y

    # ==========================================================
    # TRAIN
    # ==========================================================

    def train_model(self, dataset_path):

        print("=" * 60)
        print("CNN + BiLSTM Voice Emotion Model")
        print("=" * 60)

        # --------------------------------------------------
        # LOAD DATA
        # --------------------------------------------------

        X, y = self.load_dataset(dataset_path)

        print(f"Dataset Shape: {X.shape}")

        # --------------------------------------------------
        # ENCODE LABELS
        # --------------------------------------------------

        y_encoded = self.label_encoder.fit_transform(y)

        y_categorical = to_categorical(y_encoded)

        # --------------------------------------------------
        # SPLIT
        # --------------------------------------------------

        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y_categorical,
            test_size=0.2,
            random_state=42,
            stratify=y_categorical
        )

        X_train, X_val, y_train, y_val = train_test_split(
            X_train,
            y_train,
            test_size=0.2,
            random_state=42,
            stratify=y_train
        )

        # --------------------------------------------------
        # NORMALIZATION
        # --------------------------------------------------

        num_samples, time_steps, num_features = X_train.shape

        X_train_reshaped = X_train.reshape(-1, num_features)
        X_val_reshaped = X_val.reshape(-1, num_features)
        X_test_reshaped = X_test.reshape(-1, num_features)

        X_train_scaled = self.scaler.fit_transform(
            X_train_reshaped
        )

        X_val_scaled = self.scaler.transform(
            X_val_reshaped
        )

        X_test_scaled = self.scaler.transform(
            X_test_reshaped
        )

        X_train = X_train_scaled.reshape(X_train.shape)
        X_val = X_val_scaled.reshape(X_val.shape)
        X_test = X_test_scaled.reshape(X_test.shape)

        # --------------------------------------------------
        # CLASS WEIGHTS
        # --------------------------------------------------

        y_integers = np.argmax(y_train, axis=1)

        class_weights = compute_class_weight(
            class_weight='balanced',
            classes=np.unique(y_integers),
            y=y_integers
        )

        class_weights = dict(enumerate(class_weights))

        # --------------------------------------------------
        # BUILD MODEL
        # --------------------------------------------------

        input_shape = X_train.shape[1:]

        num_classes = len(self.label_encoder.classes_)

        self.model = self.build_model(
            input_shape,
            num_classes
        )

        self.model.summary()

        # --------------------------------------------------
        # CALLBACKS
        # --------------------------------------------------

        callbacks = [

            EarlyStopping(
                monitor='val_accuracy',
                patience=15,
                restore_best_weights=True,
                verbose=1
            ),

            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=1e-5,
                verbose=1
            ),

            ModelCheckpoint(
                filepath=str(
                    self.model_path /
                    "best_voice_model.keras"
                ),
                monitor='val_accuracy',
                save_best_only=True,
                verbose=1
            )
        ]

        # --------------------------------------------------
        # TRAIN
        # --------------------------------------------------

        self.history = self.model.fit(

            X_train,
            y_train,

            validation_data=(X_val, y_val),

            epochs=60,

            batch_size=32,

            callbacks=callbacks,

            class_weight=class_weights,

            verbose=1
        )

        # --------------------------------------------------
        # EVALUATE
        # --------------------------------------------------

        predictions = self.model.predict(X_test)

        y_pred = np.argmax(predictions, axis=1)

        y_true = np.argmax(y_test, axis=1)

        accuracy = accuracy_score(
            y_true,
            y_pred
        )

        print("\n" + "=" * 60)
        print(f"FINAL TEST ACCURACY: {accuracy*100:.2f}%")
        print("=" * 60)

        print("\nClassification Report:\n")

        print(classification_report(
            y_true,
            y_pred,
            target_names=self.label_encoder.classes_
        ))

        # --------------------------------------------------
        # SAVE
        # --------------------------------------------------

        self.save_model()

        return accuracy

    # ==========================================================
    # SAVE MODEL
    # ==========================================================

    def save_model(self):

        self.model.save(
            str(self.model_path / "voice_emotion_model.keras")
        )

        with open(
            self.model_path / "scaler.pkl",
            "wb"
        ) as f:

            pickle.dump(self.scaler, f)

        with open(
            self.model_path / "label_encoder.pkl",
            "wb"
        ) as f:

            pickle.dump(self.label_encoder, f)

        metadata = {

            "architecture": "CNN + BiLSTM",

            "feature_count": 134,

            "emotions": list(
                self.label_encoder.classes_
            ),

            "training_date": datetime.now().isoformat()
        }

        with open(
            self.model_path / "metadata.json",
            "w"
        ) as f:

            json.dump(metadata, f, indent=2)

        print("\nModel Saved Successfully!")

# ==============================================================
# MAIN
# ==============================================================

if __name__ == "__main__":

    model = HighAccuracyVoiceModel()

    accuracy = model.train_model(
        dataset_path="dataset/voice_dataset"
    )

    print(f"\nFinal Accuracy: {accuracy*100:.2f}%")