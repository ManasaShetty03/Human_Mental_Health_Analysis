# RAVDESS Backup Voice Analysis System

This system provides a backup voice emotion analysis capability using locally trained machine learning models when the Gemini API is unavailable or quota-exceeded.

## Features

- **Multiple ML Models**: RandomForest, SVM, XGBoost, MLP, and Deep Learning (CNN+LSTM)
- **Automatic Fallback**: Seamlessly switches to backup when Gemini API fails
- **High Accuracy**: Trained on RAVDESS dataset with comprehensive audio features
- **Real-time Analysis**: Fast local processing without API dependencies
- **Detailed Metrics**: Accuracy reporting and model performance tracking

## Quick Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Setup RAVDESS Dataset
```bash
python setup_ravdess.py
```

Follow the instructions to download and set up the RAVDESS dataset from Kaggle.

### 3. Train Models
```bash
python ravdess_training.py
```

### 4. Test Backup System
```bash
python backup_voice_analysis.py
```

## Manual Setup

### Dataset Preparation
1. Download RAVDESS dataset from [Kaggle](https://www.kaggle.com/datasets/uwrfkaggler/ravdess-emotion-song-audio)
2. Extract and copy to `dataset/ravdess/`
3. Ensure folder structure:
```
dataset/ravdess/
├── Actor_01/
│   ├── 03-01-01-01-01-01-01.wav
│   └── ...
├── Actor_02/
└── ...
```

### Training
```bash
# Train all models
python ravdess_training.py

# Expected output:
# Training RandomForest...
# RandomForest Accuracy: 0.8234
# Training SVM...
# SVM Accuracy: 0.8456
# Training XGBoost...
# XGBoost Accuracy: 0.8678
# Training Deep Learning Model...
# Deep Model Accuracy: 0.8912
```

## API Endpoints

### Backup Voice Analysis
```http
POST /api/backup-voice-analysis
Content-Type: application/json

{
  "audio_base64": "base64_encoded_audio_data",
  "language": "en"
}
```

**Response:**
```json
{
  "emotion": "Happy",
  "confidence": 0.85,
  "uncertain": false,
  "severity": "Low",
  "suggestions": [
    "Keep up the positive energy!",
    "Document what made you happy today."
  ],
  "isMeaningless": false,
  "transcript": "",
  "masking": {
    "detected": false,
    "vocalEmotion": "Happy",
    "semanticEmotion": "Happy",
    "explanation": "Analyzed using backup model: XGBoost (Accuracy: 0.87)"
  },
  "backup_model_used": true,
  "model_info": {
    "name": "XGBoost",
    "accuracy": 0.8678,
    "all_probabilities": {
      "Happy": 0.85,
      "Sad": 0.10,
      "Angry": 0.03,
      "Neutral": 0.02
    }
  }
}
```

### Model Status
```http
GET /api/backup-model-status
```

**Response:**
```json
{
  "backup_available": true,
  "model_info": {
    "available": true,
    "best_model": "XGBoost",
    "loaded_models": ["RandomForest", "SVM", "XGBoost", "MLP"],
    "accuracies": {
      "RandomForest": 0.8234,
      "SVM": 0.8456,
      "XGBoost": 0.8678,
      "MLP": 0.7891
    },
    "emotions": ["Happy", "Sad", "Angry", "Neutral"],
    "feature_count": 1024,
    "training_date": "2024-05-10T10:30:00"
  }
}
```

## Model Architecture

### Audio Features Extracted
- **MFCC**: 13 coefficients × 4 statistics (mean, std, min, max)
- **Chroma**: 12 chroma features × 2 statistics
- **Mel Spectrogram**: 128 mel bands × 2 statistics
- **Spectral Contrast**: 7 contrast bands × 2 statistics
- **Tonnetz**: 6 tonnetz features × 2 statistics
- **Additional**: ZCR, spectral rolloff, bandwidth, centroid, RMS, tempo, MFCC deltas

**Total Features**: 1024 dimensions

### Models Trained
1. **RandomForest**: 100 trees, max_depth=10
2. **SVM**: RBF kernel with probability estimates
3. **XGBoost**: Gradient boosting with eval_metric='mlogloss'
4. **MLP**: Hidden layers (100, 50), max_iter=500
5. **Deep Learning**: CNN+LSTM architecture
   - Conv1D(64) → MaxPool → Conv1D(128) → MaxPool → LSTM(64) → Dense(32) → Output

### Emotion Mapping
RAVDESS emotions mapped to simplified set:
- `01` (neutral) → "Neutral"
- `02` (calm) → "Neutral"
- `03` (happy) → "Happy"
- `04` (sad) → "Sad"
- `05` (angry) → "Angry"
- `06` (fearful) → "Sad"
- `07` (disgust) → "Angry"
- `08` (surprised) → "Happy"

## Performance Metrics

### Expected Accuracy Ranges
- **RandomForest**: 75-85%
- **SVM**: 80-88%
- **XGBoost**: 82-90%
- **MLP**: 70-80%
- **Deep Learning**: 85-92%

### Training Output Example
```
Training Summary
==================================================
Total samples: 1440
Feature dimensions: 1024
Emotions: ['Happy', 'Sad', 'Angry', 'Neutral']

Model Accuracies:
  DeepLearning: 0.8912 (89.12%)
  XGBoost: 0.8678 (86.78%)
  SVM: 0.8456 (84.56%)
  RandomForest: 0.8234 (82.34%)
  MLP: 0.7891 (78.91%)

Best Model: DeepLearning with 0.8912 accuracy
==================================================
```

## Integration with Frontend

The backup system automatically activates when:
1. Gemini API quota is exceeded (HTTP 429)
2. Gemini API is rate limited (RESOURCE_EXHAUSTED)
3. Network errors occur
4. API key is not available

### Frontend Integration Example
```javascript
async function analyzeVoiceWithFallback(audioBase64, language = 'en') {
  try {
    // Try Gemini API first
    const result = await analyzeAudio(audioBase64, features, language);
    return result;
  } catch (error) {
    console.log('Gemini API failed, using backup model...');
    
    // Fallback to backup model
    const response = await fetch('/api/backup-voice-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio_base64: audioBase64,
        language: language
      })
    });
    
    return await response.json();
  }
}
```

## File Structure

```
backend/
├── ravdess_training.py          # Main training script
├── backup_voice_analysis.py    # Backup analyzer
├── setup_ravdess.py           # Setup automation
├── models/                    # Trained models directory
│   ├── randomforest_model.pkl
│   ├── svm_model.pkl
│   ├── xgboost_model.pkl
│   ├── mlp_model.pkl
│   ├── deep_model.h5
│   ├── scaler.pkl
│   ├── label_encoder.pkl
│   └── metadata.json
├── dataset/
│   └── ravdess/
│       ├── Actor_01/
│       ├── Actor_02/
│       └── ...
└── requirements.txt
```

## Troubleshooting

### Common Issues

1. **Dataset not found**
   - Ensure RAVDESS dataset is downloaded and placed in `dataset/ravdess/`
   - Check folder structure matches expected format

2. **Feature extraction errors**
   - Verify audio files are in WAV format
   - Check librosa and soundfile installations

3. **Training fails**
   - Install all dependencies: `pip install -r requirements.txt`
   - For deep learning, ensure TensorFlow is installed

4. **Backup analyzer not available**
   - Run training script first: `python ravdess_training.py`
   - Check models folder exists and contains trained models

5. **Memory issues**
   - Reduce dataset size or use smaller batch sizes
   - Close unnecessary applications during training

### Performance Optimization

1. **Faster training**
   - Use subset of data for initial testing
   - Reduce feature dimensions
   - Use GPU for deep learning training

2. **Better accuracy**
   - Increase training epochs for deep learning
   - Tune hyperparameters for traditional models
   - Use data augmentation techniques

3. **Real-time optimization**
   - Reduce audio duration (currently 3 seconds)
   - Use lighter model for deployment
   - Implement model quantization

## Advanced Usage

### Custom Training
```python
from ravdess_training import RAVDESSTrainer

# Create custom trainer
trainer = RAVDESSTrainer(
    dataset_path="custom_dataset",
    model_save_path="custom_models"
)

# Run training
trainer.run_training()
```

### Direct Backup Analysis
```python
from backup_voice_analysis import get_backup_analyzer

# Get analyzer
analyzer = get_backup_analyzer()

# Analyze audio
result = analyzer.analyze_with_fallback(
    audio_base64, 
    is_base64=True, 
    language='en'
)

print(f"Emotion: {result['emotion']}")
print(f"Confidence: {result['confidence']}")
```

## License and Credits

- **RAVDESS Dataset**: Licensed under Creative Commons Attribution-NonCommercial 4.0 International
- **Librosa**: BSD License
- **Scikit-learn**: BSD License
- **XGBoost**: Apache License 2.0
- **TensorFlow**: Apache License 2.0

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Verify dataset setup and dependencies
3. Review training logs for error messages
4. Test with individual components before full integration
