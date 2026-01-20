from src.preprocessing.pipeline import is_definition_self_referential

def test_filter():
    word = "hemispherical"
    definition = "of or relating to or being a hemisphere"
    result = is_definition_self_referential(definition, word)
    print(f"Word: {word}")
    print(f"Definition: {definition}")
    print(f"Is self-referential? {result}")

    # Debugging the logic
    word_lower = word.lower()
    definition_lower = definition.lower()
    suffixes = ['ed', 'ing', 'ly', 'er', 'est', 'ness', 'ment', 'tion', 'sion', 
                'ical', 'al', 'ful', 'less', 'ous', 'ive', 'able', 'ible', 'ian']
    
    stems = [word_lower]
    for suffix in suffixes:
        if word_lower.endswith(suffix) and len(word_lower) > len(suffix) + 2:
            stem = word_lower[:-len(suffix)]
            stems.append(stem)
            print(f"Found suffix {suffix}, stem: {stem}")
            
    for stem in stems:
        if len(stem) >= 4 and stem in definition_lower:
            print(f"Match found for stem: {stem}")

if __name__ == "__main__":
    test_filter()
