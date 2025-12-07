# Neural Networks Explained: Regular, RNN, and LSTM

A comprehensive guide to understanding different types of neural networks and their applications in OCR (Optical Character Recognition).

---

## Table of Contents
1. [Regular Neural Networks](#regular-neural-networks)
2. [Recurrent Neural Networks (RNNs)](#recurrent-neural-networks-rnns)
3. [Long Short-Term Memory (LSTM)](#long-short-term-memory-lstm)
4. [Comparison](#comparison-table)
5. [Real-World Example: Receipt OCR](#real-world-example-receipt-ocr)

---

## Regular Neural Networks

### What They Are
Basic feed-forward neural networks that process inputs independently without any memory.

### Structure
```
Input Layer → Hidden Layer(s) → Output Layer
    ●              ●●●              ●
    ●        →     ●●●        →     ●
    ●              ●●●              ●
```

### How They Work
1. Take input (e.g., pixels of a single character)
2. Process through hidden layers with weights and activation functions
3. Produce output (e.g., classify as letter 'A')

### Key Characteristics
- ✅ Simple and fast
- ✅ Good for independent predictions
- ✅ Easy to train
- ❌ No memory - can't handle sequences
- ❌ Each input processed in isolation

### Example Use Case
**Recognizing a single character:**
```
Input: Image of letter 'A'
   ●●●  (pixels)
   ●●●     →    [Hidden Layers]    →    Output: 'A' (95% confidence)
   ●●●
```

**Problem:** Cannot use context from previous characters!
```
Trying to read: "T o t a l"
- Sees 'T' → outputs 'T' ✓
- Sees 'o' → outputs 'o' ✓ (but doesn't remember 'T')
- Sees 'a' → outputs 'a' ✓ (doesn't remember 'To')
- Cannot use "I just saw 'Tot'" to improve accuracy
```

---

## Recurrent Neural Networks (RNNs)

### What They Are
Neural networks with a feedback loop that allows information to persist, giving them "memory" of previous inputs.

### Structure
```
        ┌─────────────┐
        ↓             │ (feedback loop)
Input → [●] → Output  │
        └─────────────┘
        Hidden State (Memory)
```

### How They Work

**Step-by-Step Process:**

```
Time Step 1:
Input: 'T'  →  [RNN Cell]  →  Output: 'T'
                    ↓
               Hidden State: h1

Time Step 2:
Input: 'o'  →  [RNN Cell]  →  Output: 'o'
               ↑ (uses h1 as memory)
          h1 (memory from step 1)
                    ↓
               Hidden State: h2

Time Step 3:
Input: 't'  →  [RNN Cell]  →  Output: 't'
               ↑ (uses h2 as memory)
          h2 (memory from steps 1-2)
```

**Mathematical Formula:**
```
Hidden State: h_t = tanh(W_input × x_t + W_hidden × h_(t-1))
Output:       y_t = W_output × h_t

Where:
- x_t = current input
- h_(t-1) = previous hidden state (memory)
- tanh = activation function (-1 to 1)
- W = weight matrices
```

### Key Characteristics
- ✅ Has memory of previous inputs
- ✅ Can process sequences
- ✅ Uses context to improve predictions
- ❌ Memory fades over long sequences (vanishing gradient problem)
- ❌ Limited to ~10 steps of effective memory

### The Vanishing Gradient Problem

**Short sequences work fine:**
```
Reading "Cat"
C → a → t
↓   ↓   ↓
Memory flows easily through 3 steps ✓
```

**Long sequences lose memory:**
```
Reading: "Please retain this receipt for your records Total: $71.65"

P → l → e → a → s → e → ... → T → o → t → a → l → $ → 7 → 1 → . → 6 → 5
↓   ↓   ↓   ↓   ↓   ↓       ↓   ↓   ↓   ↓   ↓   ↓   ↓   ↓   ↓   ↓   ↓

Memory strength over time:
Step 1-5:   ████████░░ (80% - strong memory)
Step 10:    ██████░░░░ (60% - fading)
Step 20:    ███░░░░░░░ (30% - weak)
Step 40:    █░░░░░░░░░ (10% - almost gone)

By step 50, the memory of 'P' is completely lost! ❌
```

**Why this happens mathematically:**
```
Gradient = gradient × W × W × W × ... × W (repeated multiplication)

If W < 1:  0.9^50 = 0.005  → Vanishing gradient
If W > 1:  1.1^50 = 117    → Exploding gradient
```

---

## Long Short-Term Memory (LSTM)

### What They Are
An advanced type of RNN designed to remember information for long periods, solving the vanishing gradient problem.

### Structure
```
┌─────────────────────────────────┐
│         LSTM Cell               │
│                                 │
│  ┌──────────────┐               │
│  │ Cell State   │ ← Long-term  │
│  │   (Memory)   │    memory    │
│  └──────────────┘               │
│    ↑   ↑   ↑   ↑               │
│    │   │   │   │               │
│  [×] [+] [×] [×] ← Gates       │
│    ↑   ↑   ↑   ↑               │
│  Forget Input Output            │
│   Gate  Gate  Gate              │
│                                 │
│  h_(t-1) ────────────→ h_t     │
│            ↑                    │
│         Input                   │
└─────────────────────────────────┘
```

### The Three Gates

#### **1. Forget Gate 🗑️**
*"What should I forget from memory?"*

```
Example: Reading a receipt
Cell state: [scanning header section]
New input: "Total: $71.65"
Forget gate: "We're past the header now, forget that context"
Action: Removes header information from cell state
```

#### **2. Input Gate 📥**
*"What new information should I remember?"*

```
Cell state: [empty]
New input: "Total"
Input gate: "This is important! Remember we're in the totals section"
Action: Adds [in totals section] to cell state
```

#### **3. Output Gate 📤**
*"What should I output based on current input + memory?"*

```
Current input: Ambiguous character (could be 'O' or '0')
Cell state: [we just saw '$71.' so expecting numbers]
Output gate: "Given context, this is probably '0' not 'O'"
Output: '0' ✓
```

### How LSTMs Work

**Processing the word "Total":**

```
Step 1: See 'T'
  Input: Pixels that look like 'T'
  Cell State (Memory): [empty]
  Forget Gate: Keep everything (nothing to forget)
  Input Gate: Add [started reading a word]
  Output Gate: Output 'T'
  New Cell State: [started reading a word]

Step 2: See 'o'
  Input: Pixels that look like 'o'
  Cell State: [started reading a word, last letter was 'T']
  Forget Gate: Keep everything
  Input Gate: Add [reading word starting with "To"]
  Output Gate: Output 'o'
  New Cell State: [reading word "To..."]

Step 3: See 't'
  Input: Pixels that look like 't'
  Cell State: [reading word "To..."]
  Forget Gate: Keep everything
  Input Gate: Add [probably reading "Tot" - maybe "Total"?]
  Output Gate: Output 't'
  New Cell State: [probably "Total"]

Step 4: See 'a'
  Input: Pixels that look like 'a'
  Cell State: [probably "Total"]
  Forget Gate: Keep everything
  Input Gate: Add [definitely "Total" - common receipt word]
  Output Gate: Output 'a'
  New Cell State: [reading "Total" - high confidence]

Step 5: See 'l'
  Input: Ambiguous pixels (could be 'l', '1', or 'I')
  Cell State: [reading "Total" - high confidence]
  Forget Gate: Keep everything
  Input Gate: Pattern matches common receipt word
  Output Gate: Given context, this is 'l' ✓
  New Cell State: [just completed "Total"]
```

### Key Characteristics
- ✅ Solves vanishing gradient problem
- ✅ Can remember 100+ steps back
- ✅ Three gates control information flow
- ✅ Separate cell state for long-term memory
- ❌ 4x more complex than RNNs
- ❌ Slower to train
- ❌ Requires more computational resources

### Memory Preservation

**Long sequence with LSTM:**
```
Reading: "FedEx Ground    Receipt #45123    Total: $71.65"

F → e → d → E → x → ... → T → o → t → a → l → $ → 7 → 1 → . → 6 → 5
↓   ↓   ↓   ↓   ↓       ↓   ↓   ↓   ↓   ↓   ↓   ↓   ↓   ↓   ↓   ↓

Cell State (protected memory):
Step 1-5:   ████████░░ Store: "FedEx" - important!
Step 10:    ████████░░ Still: "FedEx" + "Ground"
Step 20:    ████████░░ Still: "FedEx Ground" context preserved
Step 40:    ████████░░ Still: Full context maintained
Step 50:    ████████░░ Still: Everything remembered! ✓

Result: When processing "$71.65", still remembers
        this is a FedEx Ground receipt
```

---

## Comparison Table

| Feature | Regular NN | RNN | LSTM |
|---------|-----------|-----|------|
| **Has Memory** | ❌ No | ✅ Yes (short) | ✅ Yes (long) |
| **Processes Sequences** | ❌ No | ✅ Yes | ✅ Yes |
| **Effective Memory Length** | 0 steps | ~10 steps | 100+ steps |
| **Complexity** | Simple | Medium | Complex |
| **Training Speed** | Fast | Medium | Slow |
| **Parameters** | ~500 | ~1,000 | ~4,000 |
| **Vanishing Gradient** | N/A | ❌ Yes | ✅ Solved |
| **Use Cases** | Image classification, single predictions | Short sequences | Long sequences, OCR, translation |
| **Invented** | 1950s | 1980s | 1997 |
| **OCR Accuracy** | ~60% | ~75% | ~95% |

---

## Real-World Example: Receipt OCR

### The Challenge
Reading text from a blurry receipt where some characters are ambiguous:

```
Receipt Image:
F_DEX GROUND
123 Main Street
Receipt #12_45
Total: $71._5
```

### Regular Neural Network Approach

**Processing each character independently:**
```
Input: F → Output: F (95% confidence)
Input: _ → Output: ? (could be E, F, I, or space)
Input: D → Output: D (90%)
Input: E → Output: E (92%)
Input: X → Output: X (88%)

Result: "F?DEX" ❌
Problem: No context to resolve ambiguity
```

### RNN Approach

**Processing with short-term memory:**
```
Step 1: F
  Memory: [empty]
  Output: F (95%)

Step 2: _ (blurry)
  Memory: [just saw 'F']
  Output: E (75% - probably 'FE...')

Step 3: D
  Memory: [saw 'FE']
  Output: D (85% - pattern 'FED')

Step 4: E
  Memory: [saw 'FED']
  Output: E (88% - might be 'FEDE...')

Step 5: X
  Memory: [saw 'FEDE']
  Output: X (90% - 'FEDEX' is common!)

... continues for 40+ characters ...

Step 45: _5 (reading the price)
  Memory: [something about a receipt... memory is fading]
  Output: 85 or 35 or 95? (60% confidence - lost context)

Result: "FEDEX GROUND ... Total: $71.?5" ❌
Problem: Lost context by the time we reach the price
```

### LSTM Approach

**Processing with long-term memory:**
```
Step 1: F
  Cell State: [empty]
  Forget Gate: Nothing to forget
  Input Gate: Store [started reading text]
  Output: F (95%)

Step 2: _ (blurry)
  Cell State: [started reading, saw 'F']
  Forget Gate: Keep all info
  Input Gate: Add [pattern starting with 'F_']
  Output Gate: Check memory → probably 'E' (92%)
  Output: E ✓

Step 3-5: D, E, X
  Cell State: [reading 'F-E-D-E-X']
  Input Gate: Add [this is "FedEx" - shipping company]
  Output: D, E, X (high confidence)

Step 6-10: Space, G, R, O, U
  Cell State: [FedEx, now reading second word]
  Input Gate: Add [second word starts with 'G']
  Output: [space], G, R, O, U

Step 11: N
  Cell State: [FedEx, reading "Groun..."]
  Input Gate: Add [probably "Ground"]
  Output: N

Step 12: D
  Cell State: [FedEx, "Ground" - common pattern]
  Input Gate: Store [FedEx Ground - known merchant]
  Output: D

... continues through address and receipt number ...

Step 42-45: Reading "$71._5"
  Cell State: [FedEx Ground receipt, in totals section, reading price]
  Forget Gate: Remove header info (not needed)
  Input Gate: Keep [reading price in format $XX.XX]
  Output Gate: Check memory → this is a price
  
  For '_':
    Context: Dollar amounts typically end in .00, .25, .50, .65, .75, .85, .95, .99
    Last digit is 5
    Pattern $71._5 where _5 is common ending
    Best match: 6 (making $71.65) ✓
  
  Output: 6

Final Step: 5
  Cell State: [FedEx Ground, total is $71.65]
  Output: 5 (100% confidence - validates .X5 pattern)

Result: "FEDEX GROUND ... Total: $71.65" ✓
Success: Maintained full context throughout entire receipt!
```

### Accuracy Comparison on Blurry Receipt

| Approach | Result | Accuracy | Key Issue |
|----------|--------|----------|-----------|
| Regular NN | "F?DEX ... $71.?5" | ~60% | No memory at all |
| RNN | "FEDEX ... $71.?5" | ~75% | Memory faded by end |
| LSTM | "FEDEX GROUND ... $71.65" | ~95% | Maintained context |

---

## Code Analogy

### Regular Neural Network = Pure Function
```python
def recognize_character(pixel_data):
    # No memory, no context
    return classify(pixel_data)

# Each call is independent
recognize_character(image_of_T)  # Returns 'T'
recognize_character(image_of_o)  # Returns 'o' (doesn't know we saw 'T')
recognize_character(image_of_t)  # Returns 't' (doesn't know we saw 'To')
```

### RNN = Function with Global Variable
```python
memory = None  # Simple variable for memory

def recognize_with_rnn(pixel_data):
    global memory
    # Use current memory to help recognition
    result = classify(pixel_data, context=memory)
    # Update memory (but gets overwritten)
    memory = result
    return result

# Has memory, but limited
recognize_with_rnn(image_of_T)  # memory = 'T'
recognize_with_rnn(image_of_o)  # memory = 'To'
recognize_with_rnn(image_of_t)  # memory = 'Tot'
# ... after 50 characters ...
# memory ≈ recent chars only, 'T' is lost!
```

### LSTM = Object with Protected Storage
```python
class LSTM:
    def __init__(self):
        self.cell_state = {}      # Protected long-term memory
        self.hidden_state = None  # Working memory
    
    def forget(self, cell_state):
        """Forget gate: remove irrelevant info"""
        return {k: v for k, v in cell_state.items() if is_relevant(k, v)}
    
    def remember(self, input_data):
        """Input gate: add new important info"""
        new_info = extract_important_info(input_data)
        return new_info
    
    def recognize(self, pixel_data):
        # Forget gate: clean up memory
        self.cell_state = self.forget(self.cell_state)
        
        # Input gate: add new info
        self.cell_state.update(self.remember(pixel_data))
        
        # Output gate: use both current input and long-term memory
        result = classify(pixel_data, context=self.cell_state)
        
        return result

# Has protected long-term memory
lstm = LSTM()
lstm.recognize(image_of_T)  # cell_state = {'start': 'T'}
lstm.recognize(image_of_o)  # cell_state = {'start': 'T', 'word': 'To'}
# ... after 50 characters ...
# cell_state = {'start': 'T', 'merchant': 'FedEx', 'reading': 'Total', ...}
# 'T' is still preserved in cell_state! ✓
```

---

## Why Tesseract Uses LSTM

### Tesseract v3 (RNN-based)
```
Reading: "TOTAL"
T: 95% confidence
O: 90% (losing context)
T: 75% (could be 'T' or 'I'?)
A: 70% (struggling)
L: 60% (might be 'L' or '1'?)

Result: "T0TA1" ❌ (60% accuracy)
```

### Tesseract v4+ (LSTM-based)
```
Reading: "TOTAL"
T: 95% confidence
O: 92% (remembers we're reading a word)
T: 93% (pattern "TOT" is common prefix)
A: 94% (likely "TOTAL" - common on receipts)
L: 96% (high confidence - completes "TOTAL")

Result: "TOTAL" ✓ (95%+ accuracy)
```

### Why LSTM is Better for OCR

**Receipts require long-range context:**
- Lines can be 50+ characters long
- "$" at position 30 indicates numbers will follow
- "Total:" at position 25 indicates the final amount is coming
- Merchant name at start helps categorize the receipt

**LSTM capabilities match OCR needs:**
- ✅ Remember merchant name throughout entire receipt
- ✅ Use "$" to predict decimal numbers
- ✅ Use "Total:" to identify the important amount
- ✅ Distinguish O/0, l/1/I using word context
- ✅ Handle poor image quality with context clues

---

## Summary

### Evolution of Neural Networks for Text

1. **Regular Neural Networks (1950s-1980s)**
   - No memory
   - Each character independent
   - ~60% accuracy on receipts

2. **RNNs (1980s-1990s)**
   - Added memory
   - Could use context
   - ~75% accuracy (limited by vanishing gradients)

3. **LSTMs (1997-present)**
   - Solved memory problem
   - Long-range context
   - ~95%+ accuracy on receipts

### Key Takeaways

- **Memory is crucial** for reading text from images
- **LSTMs solve the vanishing gradient problem** through specialized gates
- **Tesseract uses LSTM** for better accuracy on real-world receipts
- **LSTMs are NOT LLMs** - they recognize patterns, not understand meaning
- **Your receipt app runs entirely offline** thanks to efficient LSTM implementation

---

## Further Resources

- [Understanding LSTM Networks](http://colah.github.io/posts/2015-08-Understanding-LSTMs/) by Christopher Olah
- [The Unreasonable Effectiveness of Recurrent Neural Networks](http://karpathy.github.io/2015/05/21/rnn-effectiveness/) by Andrej Karpathy
- [Tesseract OCR Documentation](https://tesseract-ocr.github.io/)
- [Long Short-Term Memory (Original Paper, 1997)](https://www.bioinf.jku.at/publications/older/2604.pdf) by Hochreiter & Schmidhuber

---

*Created: November 12, 2025*
*Context: Understanding neural networks in receipt OCR applications*

