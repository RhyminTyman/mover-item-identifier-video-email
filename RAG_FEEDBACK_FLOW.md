# RAG Feedback System Architecture

## Complete Flow: Feedback → RAG → Prompt Enhancement

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

1. USER UPLOADS IMAGES & AI ANALYZES
   │
   ├─► Original AI analysis stored
   │   └─► AnalysisResult saved to state
   │
   ├─► AI predictions with confidence scores
   │   └─► Items identified, dimensions estimated
   │
   └─► USER MAKES EDITS (Add/Remove/Modify items)
       │
       ├─► ML Feedback Collected (src/lib/ml-feedback.ts)
       │   ├─► Detects: Added items (AI missed)
       │   ├─► Detects: Removed items (AI false positives)
       │   ├─► Detects: Modified items (corrections)
       │   └─► Stores in FeedbackSession table
       │
       └─► Training Data Collected (src/lib/training-data-collector.ts)
           ├─► Complete training data point:
           │   ├─► Original AI predictions
           │   ├─► User corrections (ground truth)
           │   ├─► Image context & metadata
           │   ├─► Prompt used
           │   ├─► Model parameters
           │   └─► Edit patterns
           └─► Stores in TrainingData table (ready for model training)

┌─────────────────────────────────────────────────────────────────┐
│                    RAG PROMPT ENHANCEMENT                        │
└─────────────────────────────────────────────────────────────────┘

2. NEXT USER ANALYZES IMAGES
   │
   ├─► /api/analyze endpoint called
   │
   ├─► RAG System Activated (src/lib/rag-prompt-enhancer.ts)
   │   │
   │   ├─► Retrieves Recent Feedback (last 7 days)
   │   │   └─► From FeedbackSession table
   │   │   └─► ItemAnalytics data
   │   │
   │   ├─► Retrieves Training Data Insights (last 7 days)
   │   │   └─► From TrainingData table
   │   │   └─► More comprehensive edit patterns
   │   │   └─► Accuracy scores
   │   │
   │   └─► Aggregates Insights:
   │       ├─► Commonly missed items (with frequency)
   │       ├─► Commonly over-identified items (false positives)
   │       ├─► Problematic rooms (high error rates)
   │       ├─► Dimension accuracy issues
   │       └─► Context-specific patterns
   │
   └─► Generates Enhanced Prompt:
       │
       └─► Base Prompt + RAG Insights
           ├─► "Pay attention to: Floor Lamp, Bookshelf (missed 15x)"
           ├─► "Be conservative with: Wall Art, Mirror (12x false positives)"
           ├─► "Focus areas: Bedroom (25% error rate), Kitchen (18%)"
           └─► "Dimension accuracy: 72% - be more precise with Books, Chairs"

┌─────────────────────────────────────────────────────────────────┐
│                    DATA STORAGE STRUCTURE                        │
└─────────────────────────────────────────────────────────────────┘

FEEDBACK SESSION (Lightweight feedback)
├─► Session ID
├─► Corrected items count
├─► AI feedback insights
├─► Learning insights
└─► Suggested improvements

TRAINING DATA (Comprehensive training data)
├─► Full training data point (JSON)
│   ├─► Image context (URL/base64, metadata)
│   ├─► Original AI predictions
│   ├─► Ground truth (user corrections)
│   ├─► Prompt used
│   ├─► Model info
│   └─► Edit details
├─► Quick access fields:
│   ├─► Item count, edit count
│   ├─► Accuracy score
│   ├─► Image quality
│   └─► Model version
└─► Instruction format (ready for fine-tuning)

┌─────────────────────────────────────────────────────────────────┐
│                    HOW RAG ENHANCES PROMPTS                      │
└─────────────────────────────────────────────────────────────────┘

EXAMPLE PROMPT ENHANCEMENT:

BASE PROMPT:
"Analyze these room photos and create inventory..."

+ RAG ENHANCEMENT (from feedback):
"
🔍 IMPORTANT - Based on 7 days of user feedback:
Pay EXTRA attention to these commonly missed items: 
Floor Lamp (missed 15x), Bookshelf (missed 12x), Desk Chair (missed 8x)
These items are often in the background or partially obscured. Scan carefully!

⚠️ Low accuracy areas: Floor Lamp, Bookshelf - be especially thorough here.

⚠️ CAUTION - False positives detected:
These items are sometimes incorrectly identified: 
Wall Art (18x false positives), Mirror (12x false positives)
Be MORE conservative - only identify these if you're 95%+ confident.

🏠 FOCUS AREAS - High correction rate:
Users frequently make corrections in: 
Bedroom (25.3% error rate), Kitchen (18.1% error rate)
Take extra care and double-check your analysis in these spaces.

📏 DIMENSION ACCURACY:
These items often have dimension errors: 
Books (~28% error), Chairs (~22% error)
Current overall dimension accuracy: 72.5%
Be more precise with measurements for these item types.
"

= ENHANCED PROMPT SENT TO AI

┌─────────────────────────────────────────────────────────────────┐
│                    BENEFITS OF THIS SYSTEM                        │
└─────────────────────────────────────────────────────────────────┘

✅ REAL-TIME LEARNING
   - Every user correction improves future analyses
   - No manual tuning required
   - Self-improving system

✅ RAG-BASED ENHANCEMENT
   - Retrieves relevant insights from past feedback
   - Combines feedback + training data for comprehensive view
   - Context-aware prompt improvements

✅ DUAL PURPOSE DATA COLLECTION
   - Feedback: Quick insights for prompt enhancement (RAG)
   - Training Data: Comprehensive dataset for model fine-tuning

✅ ACCURACY IMPROVEMENT
   - Addresses specific failure modes
   - Room-specific guidance
   - Item-specific attention cues
   - Dimension accuracy tracking

✅ PRODUCTION READY
   - Automatic collection (zero config)
   - Efficient storage (indexed queries)
   - Scalable (handles growing dataset)

┌─────────────────────────────────────────────────────────────────┐
│                    USAGE EXAMPLES                                 │
└─────────────────────────────────────────────────────────────────┘

1. User uploads kitchen photos
   └─► AI misses "Cutting Board" (common missed item)
   └─► User adds it manually
   └─► Feedback recorded

2. Next user uploads kitchen photos
   └─► RAG system retrieves: "Cutting Board missed 5x"
   └─► Prompt enhanced: "Pay attention to Cutting Board"
   └─► AI now finds Cutting Board more consistently

3. Over time, AI gets better:
   └─► Fewer missed items
   └─► Fewer false positives
   └─► Better dimension accuracy
   └─► Room-specific improvements

