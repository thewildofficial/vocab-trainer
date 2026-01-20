#!/usr/bin/env python3
"""Demo: Run a simulated quiz session to test the full system."""

import sys
import csv
import random
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.models.elo import EloRating
from src.models.calibration import BinarySearchCalibration
from src.quiz.word_selector import WordSelector
from src.quiz.distractor_generator import DistractorGenerator


def load_words():
    """Load processed words from CSV."""
    words_file = Path(__file__).parent.parent / "data" / "processed" / "words.csv"
    
    words = []
    with open(words_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            words.append({
                'word': row['word'],
                'definition': row['definition'],
                'pos': row['pos'],
                'example': row['example'],
                'difficulty': float(row['difficulty']),
                'frequency_rank': int(row['frequency_rank'])
            })
    
    return words


def simulate_quiz_session(true_ability=1300, num_questions=20):
    """
    Simulate a quiz session with a user of known ability.
    
    Args:
        true_ability: User's true vocabulary level (for simulation)
        num_questions: Number of questions to simulate
    """
    print(f"\n{'='*60}")
    print(f"SIMULATED QUIZ SESSION")
    print(f"True user ability: {true_ability}")
    print(f"{'='*60}\n")
    
    # Load words
    words = load_words()
    print(f"Loaded {len(words)} words\n")
    
    # Initialize components
    elo = EloRating(k_factor=25)
    calibration = BinarySearchCalibration()
    selector = WordSelector(words, elo)
    distractors = DistractorGenerator(words)
    
    user_rating = 1200  # Starting rating
    correct_count = 0
    ratings_history = [user_rating]
    
    print("Starting calibration phase...\n")
    
    for q in range(num_questions):
        # Select word based on calibration or rating
        if not calibration.is_complete():
            target_diff = calibration.get_calibration_difficulty()
            word = selector.select_for_calibration(target_diff)
            phase = "CALIBRATION"
        else:
            word = selector.select(user_rating)
            phase = "ADAPTIVE"
        
        # Generate quiz question
        question = distractors.create_quiz_question(word)
        
        # Simulate user response based on true ability
        expected = elo.expected_score(true_ability, word['difficulty'])
        correct = random.random() < expected
        
        # Update calibration if still in that phase
        if not calibration.is_complete():
            calibration.update(correct)
            if calibration.is_complete():
                user_rating = calibration.get_initial_rating()
                print(f"  >> Calibration complete! Initial rating: {user_rating:.0f}\n")
        
        # Update Elo ratings
        old_rating = user_rating
        user_rating, _ = elo.update_ratings(user_rating, word['difficulty'], correct)
        ratings_history.append(user_rating)
        
        if correct:
            correct_count += 1
        
        # Print question result
        result = "✓" if correct else "✗"
        print(f"Q{q+1:2d} [{phase:11s}] {result} {word['word']:15s} "
              f"(diff:{word['difficulty']:4.0f}) "
              f"Rating: {old_rating:.0f} → {user_rating:.0f}")
    
    # Summary
    print(f"\n{'='*60}")
    print("SESSION SUMMARY")
    print(f"{'='*60}")
    print(f"Questions answered: {num_questions}")
    print(f"Correct answers: {correct_count}/{num_questions} ({100*correct_count/num_questions:.1f}%)")
    print(f"Final rating: {user_rating:.0f}")
    print(f"True ability: {true_ability}")
    print(f"Rating error: {abs(user_rating - true_ability):.0f} points")
    print(f"Rating history: {ratings_history[0]:.0f} → {ratings_history[-1]:.0f}")
    
    # Did it converge?
    if abs(user_rating - true_ability) < 100:
        print(f"\n✅ SUCCESS: Converged within 100 points of true ability!")
    else:
        print(f"\n⚠️  Still converging (error > 100 points)")


def interactive_quiz(username: str = "default_user"):
    """Run an interactive quiz session."""
    print(f"\n{'='*60}")
    print("INTERACTIVE VOCABULARY QUIZ")
    print(f"{'='*60}\n")
    
    from src.session_manager import SessionManager
    import time
    
    session_mgr = SessionManager(username=username)
    session_mgr.start_session()
    
    if not session_mgr.user:
        print("Error: Failed to load user profile.")
        return

    words = load_words()
    elo = EloRating(k_factor=25)
    selector = WordSelector(words, elo)
    distractors = DistractorGenerator(words)
    
    user_rating = session_mgr.user.current_rating
    
    print(f"User: {username}")
    print(f"Current Rating: {user_rating:.0f}")
    print("Answer the multiple choice questions.")
    print("Enter 1, 2, 3, or 4 to select your answer.")
    print("Enter 'q' to quit.\n")
    
    question_num = 0
    
    while True:
        question_num += 1
        
        word = selector.select(user_rating)
        
        if not word:
            print("Error: Could not select a word. Checking database...")
            break
            
        phase = "Quiz"
        
        # Generate question
        question = distractors.create_quiz_question(word)
        
        print(f"\n--- Question {question_num} ({phase}) ---")
        print(f"Your rating: {user_rating:.0f}")
        print(f"\nWhat is the definition of '{word['word']}'?\n")
        
        for i, choice in enumerate(question['choices'], 1):
            print(f"  {i}. {choice}")
        
        # Get answer
        start_time = time.time()
        answer = input("\nYour answer (1-4 or 'q'): ").strip()
        end_time = time.time()
        time_taken_ms = int((end_time - start_time) * 1000)
        
        if answer.lower() == 'q':
            session_mgr.end_session()
            print(f"\nSession ended. Final rating: {user_rating:.0f}")
            break
        
        try:
            answer_idx = int(answer) - 1
            correct = answer_idx == question['correct_index']
        except (ValueError, IndexError):
            print("Invalid input. Please enter 1, 2, 3, or 4.")
            continue
        
        old_rating = user_rating
        user_rating = session_mgr.record_attempt(
            word_data=word,
            is_correct=correct,
            time_taken_ms=time_taken_ms
        )
        
        if correct:
            print(f"\n✓ Correct! Rating: {old_rating:.0f} → {user_rating:.0f}")
        else:
            print(f"\n✗ Wrong. The answer was: {question['choices'][question['correct_index']]}")
            print(f"  Rating: {old_rating:.0f} → {user_rating:.0f}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Test the vocab trainer system")
    parser.add_argument("--interactive", "-i", action="store_true",
                        help="Run interactive quiz")
    parser.add_argument("--user", "-u", type=str, default="default_user",
                        help="Username for interactive mode")
    parser.add_argument("--ability", type=int, default=1300,
                        help="Simulated user ability (default: 1300)")
    parser.add_argument("--questions", "-n", type=int, default=20,
                        help="Number of questions (default: 20)")
    
    args = parser.parse_args()
    
    if args.interactive:
        interactive_quiz(username=args.user)
    else:
        simulate_quiz_session(true_ability=args.ability, num_questions=args.questions)
