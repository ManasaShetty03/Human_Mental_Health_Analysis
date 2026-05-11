#!/usr/bin/env python3
"""
RoBERTa Pretrained Emotion Model
No Training Required
High Accuracy Emotion + Mental Health Detection
"""

import json
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")

# ==========================================================
# TRANSFORMERS
# ==========================================================

from transformers import pipeline
import torch

# ==========================================================
# MAIN MODEL CLASS
# ==========================================================

class RoBERTaEmotionModel:

    def __init__(self, model_path="models"):

        self.model_path = Path(model_path)
        self.model_path.mkdir(exist_ok=True)

        print("\nLoading RoBERTa emotion model...\n")

        try:

            self.classifier = pipeline(

                "text-classification",

                model="j-hartmann/emotion-english-distilroberta-base",

                top_k=None,

                device=0 if torch.cuda.is_available() else -1
            )

            print("✅ RoBERTa model loaded successfully!")

        except Exception as e:

            print(f"❌ Error loading model: {e}")

            self.classifier = None

        # ==================================================
        # MENTAL STATE MAPPING
        # ==================================================

        self.emotion_to_mental_state = {

            "joy": "Positive",
            "love": "Positive",
            "optimism": "Positive",
            "admiration": "Positive",
            "approval": "Positive",
            "gratitude": "Positive",
            "caring": "Positive",
            "excitement": "Positive",
            "amusement": "Positive",
            "pride": "Positive",

            "sadness": "Depressed",
            "grief": "Depressed",
            "disappointment": "Depressed",
            "loneliness": "Depressed",
            "remorse": "Depressed",

            "anger": "Stressed",
            "annoyance": "Stressed",
            "disgust": "Stressed",
            "frustration": "Stressed",

            "fear": "Anxious",
            "nervousness": "Anxious",
            "anxiety": "Anxious",
            "worry": "Anxious",

            "surprise": "Alert",
            "realization": "Alert",

            "neutral": "Stable"
        }

        # ==================================================
        # SIMPLIFIED EMOTIONS
        # ==================================================

        self.simplified_emotions = {

            "joy": "Happy",
            "love": "Happy",
            "optimism": "Happy",
            "admiration": "Happy",
            "approval": "Happy",
            "gratitude": "Happy",
            "caring": "Happy",
            "excitement": "Happy",
            "amusement": "Happy",
            "pride": "Happy",

            "sadness": "Sad",
            "grief": "Sad",
            "disappointment": "Sad",
            "loneliness": "Sad",
            "remorse": "Sad",

            "anger": "Angry",
            "annoyance": "Angry",
            "disgust": "Angry",
            "frustration": "Angry",

            "fear": "Sad",
            "nervousness": "Sad",
            "anxiety": "Sad",
            "worry": "Sad",

            "surprise": "Happy",

            "realization": "Neutral",

            "neutral": "Neutral"
        }

    # ======================================================
    # PREDICT EMOTION
    # ======================================================

    def predict_emotion(self, text):

        if not self.classifier:

            print("❌ Model not loaded")

            return None

        try:

            # ------------------------------------------------
            # PREDICT
            # ------------------------------------------------

            results = self.classifier(text)

            # ------------------------------------------------
            # HANDLE OUTPUT FORMAT
            # ------------------------------------------------

            if isinstance(results, list) and len(results) > 0:

                # top_k=None returns nested list
                if isinstance(results[0], list):

                    all_results = results[0]

                else:

                    all_results = results

                # Get highest confidence prediction
                top_result = max(
                    all_results,
                    key=lambda x: x["score"]
                )

            elif isinstance(results, dict):

                top_result = results

                all_results = [results]

            else:

                return {

                    "emotion": "Neutral",

                    "confidence": 0.0,

                    "mental_state": "Stable",

                    "model": "RoBERTa"
                }

            # ------------------------------------------------
            # EXTRACT VALUES
            # ------------------------------------------------

            emotion = top_result["label"].lower()

            confidence = top_result["score"]

            # ------------------------------------------------
            # MAPPING
            # ------------------------------------------------

            simplified_emotion = \
                self.simplified_emotions.get(

                    emotion,

                    emotion.capitalize()
                )

            mental_state = \
                self.emotion_to_mental_state.get(

                    emotion,

                    "Stable"
                )

            # ------------------------------------------------
            # RETURN
            # ------------------------------------------------

            return {

                "emotion":
                    simplified_emotion,

                "confidence":
                    round(confidence * 100, 2),

                "mental_state":
                    mental_state,

                "detailed_emotion":
                    emotion,

                "model":
                    "RoBERTa",

                "all_predictions": [

                    {

                        "emotion":
                            self.simplified_emotions.get(

                                r["label"].lower(),

                                r["label"].capitalize()
                            ),

                        "detailed_emotion":
                            r["label"],

                        "confidence":
                            round(r["score"] * 100, 2),

                        "mental_state":
                            self.emotion_to_mental_state.get(

                                r["label"].lower(),

                                "Stable"
                            )
                    }

                    for r in all_results
                ]
            }

        except Exception as e:

            print(f"❌ Error predicting emotion: {e}")

            return None

    # ======================================================
    # ANALYZE MENTAL HEALTH
    # ======================================================

    def analyze_mental_health(self, text):

        result = self.predict_emotion(text)

        if not result:
            return None

        mental_state = result["mental_state"]

        confidence = result["confidence"]

        risk_level = "Low"

        recommendations = []

        # --------------------------------------------------
        # RISK ANALYSIS
        # --------------------------------------------------

        if mental_state in [

            "Depressed",

            "Anxious",

            "Stressed"
        ]:

            if confidence >= 80:

                risk_level = "High"

                recommendations = [

                    "Consider speaking with a mental health professional",

                    "Talk to trusted friends or family",

                    "Practice relaxation techniques",

                    "Take proper rest and sleep",

                    "Monitor emotional changes regularly"
                ]

            elif confidence >= 60:

                risk_level = "Medium"

                recommendations = [

                    "Practice meditation or breathing exercises",

                    "Take regular breaks",

                    "Exercise regularly",

                    "Avoid overthinking"
                ]

            else:

                recommendations = [

                    "Take some rest",

                    "Stay connected with supportive people"
                ]

        elif mental_state == "Positive":

            recommendations = [

                "Continue positive activities",

                "Maintain social connections",

                "Practice gratitude",

                "Keep healthy routines"
            ]

        else:

            recommendations = [

                "Maintain emotional balance",

                "Continue healthy habits"
            ]

        # --------------------------------------------------
        # RETURN
        # --------------------------------------------------

        return {

            "text": text,

            "emotion":
                result["emotion"],

            "confidence":
                result["confidence"],

            "mental_state":
                mental_state,

            "risk_level":
                risk_level,

            "recommendations":
                recommendations,

            "detailed_emotion":
                result["detailed_emotion"],

            "all_predictions":
                result["all_predictions"],

            "model":
                "RoBERTa"
        }

    # ======================================================
    # SAVE MODEL INFO
    # ======================================================

    def save_model_info(self):

        model_info = {

            "model_type":
                "RoBERTa Emotion Classifier",

            "model_name":
                "j-hartmann/emotion-english-distilroberta-base",

            "provider":
                "HuggingFace",

            "training_required":
                False,

            "real_time_prediction":
                True,

            "gpu_support":
                torch.cuda.is_available(),

            "supported_emotions":
                list(
                    set(
                        self.simplified_emotions.values()
                    )
                )
        }

        with open(

            self.model_path /
            "roberta_model_info.json",

            "w"

        ) as f:

            json.dump(
                model_info,
                f,
                indent=2
            )

        print("✅ Model info saved")

# ==========================================================
# FLASK APP
# ==========================================================

def create_flask_app():

    from flask import Flask, request, jsonify

    app = Flask(__name__)

    model = RoBERTaEmotionModel()

    # ------------------------------------------------------
    # SINGLE TEXT
    # ------------------------------------------------------

    @app.route(
        "/api/emotion",
        methods=["POST"]
    )

    def detect_emotion():

        try:

            data = request.get_json()

            text = data.get("text", "")

            if not text:

                return jsonify({

                    "error":
                        "No text provided"

                }), 400

            result = model.analyze_mental_health(
                text
            )

            return jsonify(result)

        except Exception as e:

            return jsonify({

                "error": str(e)

            }), 500

    # ------------------------------------------------------
    # BATCH
    # ------------------------------------------------------

    @app.route(
        "/api/batch-emotion",
        methods=["POST"]
    )

    def batch_emotion():

        try:

            data = request.get_json()

            texts = data.get("texts", [])

            results = []

            for text in texts:

                result = model.analyze_mental_health(
                    text
                )

                if result:
                    results.append(result)

            return jsonify({

                "results": results

            })

        except Exception as e:

            return jsonify({

                "error": str(e)

            }), 500

    # ------------------------------------------------------
    # STATUS
    # ------------------------------------------------------

    @app.route(
        "/api/status",
        methods=["GET"]
    )

    def status():

        return jsonify({

            "status": "running",

            "model": "RoBERTa",

            "gpu":
                torch.cuda.is_available()
        })

    return app

# ==========================================================
# MAIN
# ==========================================================

if __name__ == "__main__":

    print("=" * 60)

    print("RoBERTa Pretrained Emotion Model")

    print("=" * 60)

    print(
        "🤖 Model: "
        "j-hartmann/emotion-english-distilroberta-base"
    )

    print("⚡ No Training Required")

    print("🎯 High Accuracy Emotion Detection")

    print("=" * 60)

    # ------------------------------------------------------
    # LOAD MODEL
    # ------------------------------------------------------

    model = RoBERTaEmotionModel()

    model.save_model_info()

    # ------------------------------------------------------
    # TEST TEXTS
    # ------------------------------------------------------

    test_texts = [

        "I can't tolerate this anymore",

        "I am not happy",

        "I am angry and frustrated right now.",

        "I feel anxious about my future.",

        "Today was a normal day.",

        "I love spending time with my family.",

        "I feel lonely and emotionally broken."
    ]

    print("\n🧪 Testing Predictions...\n")

    for text in test_texts:

        result = model.analyze_mental_health(
            text
        )

        if result:

            print(f"\nText: {text}")

            print(
                f"Emotion: "
                f"{result['emotion']}"
            )

            print(
                f"Confidence: "
                f"{result['confidence']}%"
            )

            print(
                f"Mental State: "
                f"{result['mental_state']}"
            )

            print(
                f"Risk Level: "
                f"{result['risk_level']}"
            )

            print("-" * 50)

    print("\n🎉 Model Ready!")

    # ------------------------------------------------------
    # OPTIONAL FLASK SERVER
    # ------------------------------------------------------

    choice = input(
        "\nStart Flask server? (y/n): "
    ).lower()

    if choice == "y":

        print("\n🚀 Starting Flask Server...\n")

        app = create_flask_app()

        app.run(

            host="0.0.0.0",

            port=5002,

            debug=True
        )

    else:

        print("\n✅ Ready for integration!")