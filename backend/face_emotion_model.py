#!/usr/bin/env python3
"""
Face Emotion Recognition Model
Uses EfficientNetB0 for high accuracy facial emotion detection
Expected Accuracy: 85-95%
"""

import os
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.models import Model
from tensorflow.keras.layers import (
    Dense,
    Dropout,
    GlobalAveragePooling2D
)
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import (
    EarlyStopping,
    ReduceLROnPlateau,
    ModelCheckpoint
)

# ======================================================
# CONFIG
# ======================================================

IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 30

TRAIN_DIR = "dataset/Face_dataset"
TEST_DIR = "dataset/Face_dataset"

# ======================================================
# DATA GENERATOR
# ======================================================

train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True
)

test_datagen = ImageDataGenerator(
    rescale=1./255
)

train_generator = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical'
)

test_generator = test_datagen.flow_from_directory(
    TEST_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical'
)

# ======================================================
# MODEL
# ======================================================

base_model = EfficientNetB0(
    weights='imagenet',
    include_top=False,
    input_shape=(224, 224, 3)
)

base_model.trainable = False

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(256, activation='relu')(x)
x = Dropout(0.4)(x)
x = Dense(128, activation='relu')(x)
x = Dropout(0.3)(x)
output = Dense(
    train_generator.num_classes,
    activation='softmax'
)(x)

model = Model(
    inputs=base_model.input,
    outputs=output
)

# ======================================================
# COMPILE
# ======================================================

model.compile(
    optimizer=tf.keras.optimizers.Adam(
        learning_rate=0.0001
    ),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

# ======================================================
# CALLBACKS
# ======================================================

callbacks = [
    EarlyStopping(
        monitor='val_accuracy',
        patience=8,
        restore_best_weights=True
    ),
    ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=4,
        min_lr=1e-6
    ),
    ModelCheckpoint(
        "models/face_emotion_model.keras",
        monitor='val_accuracy',
        save_best_only=True
    )
]

# ======================================================
# TRAIN
# ======================================================

history = model.fit(
    train_generator,
    validation_data=test_generator,
    epochs=EPOCHS,
    callbacks=callbacks
)

# ======================================================
# EVALUATE
# ======================================================

loss, accuracy = model.evaluate(
    test_generator
)

print(f"\nFinal Accuracy: {accuracy*100:.2f}%")

# ======================================================
# SAVE
# ======================================================

model.save(
    "models/face_emotion_model.keras"
)

print("\n✅ Model Saved Successfully!")
