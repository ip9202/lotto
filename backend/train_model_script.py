"""
ML Model Training Script
Trains a new model using the latest lottery data
"""
import sys
import time
from pathlib import Path

# Add app directory to path
sys.path.append(str(Path(__file__).parent))

from app.database import get_db
from app.services.ml import data_preprocessor
from app.services.ml import model_trainer
from app.services.ml import model_utils


def main():
    """Train ML model with latest data"""
    start_time = time.time()

    print("="*60)
    print("ML Model Training Pipeline")
    print("="*60)

    # Step 1: Load data
    print("\n[1/6] Loading draw data from database...")
    db = next(get_db())
    draw_data = data_preprocessor.load_draw_data(db)
    print(f"✓ Loaded {len(draw_data)} draws")

    # Step 2: Extract features
    print("\n[2/6] Extracting features...")
    features_df = data_preprocessor.extract_features(draw_data)
    print(f"✓ Extracted {len(features_df.columns)} features")

    # Step 3: Prepare train/test split
    print("\n[3/6] Preparing train/test split...")
    X_train, X_test, y_train, y_test = data_preprocessor.prepare_train_test_split(
        features_df,
        draw_data  # Pass original draw data for target label creation
    )
    print(f"✓ Training samples: {len(X_train)}, Test samples: {len(X_test)}")
    print(f"✓ Multi-label targets: {y_train.shape[1]} labels per sample")

    # Step 4: Train model
    print("\n[4/6] Training MultiOutputClassifier with Random Forest...")
    model = model_trainer.train_model(
        X_train,
        y_train,
        n_estimators=100,
        random_state=42
    )
    n_trees = model.estimators_[0].n_estimators if model.estimators_ else 100
    print(f"✓ Model trained with {n_trees} trees per classifier")

    # Step 5: Evaluate model
    print("\n[5/6] Evaluating model...")
    metrics = model_trainer.evaluate_model(model, X_test, y_test)
    print(f"✓ Subset Accuracy: {metrics['accuracy']:.2%}")
    print(f"  Hamming Loss: {metrics['hamming_loss']:.4f}")
    print(f"  Macro Precision: {metrics['precision']:.2%}")
    print(f"  Macro Recall: {metrics['recall']:.2%}")
    print(f"  Macro F1 Score: {metrics['f1_score']:.2%}")

    # Step 6: Save model
    print("\n[6/6] Saving trained model...")
    model_path = model_trainer.save_trained_model(
        model,
        metrics,
        model_name="production_model"
    )
    print(f"✓ Model saved to: {model_path}")

    # Summary
    elapsed_time = time.time() - start_time
    print("\n" + "="*60)
    print("Training Complete!")
    print("="*60)
    print(f"Total time: {elapsed_time:.2f} seconds")
    print(f"Model accuracy: {metrics['accuracy']:.2%}")
    print(f"Model location: {model_path}")
    print("="*60)

    db.close()


if __name__ == "__main__":
    main()
