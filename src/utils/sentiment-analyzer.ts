/**
 * @fileOverview Sentiment analysis utility for MITR AI
 * Provides real-time sentiment analysis with emotion detection and health metrics
 */

const EMOTION_KEYWORDS = {
  happy: ['happy', 'joy', 'great', 'excited', 'wonderful', 'awesome', 'good'],
  sad: ['sad', 'upset', 'unhappy', 'depressed', 'down', 'hurt', 'pain'],
  angry: ['angry', 'frustrated', 'mad', 'annoyed', 'irritated', 'furious'],
  anxious: ['anxious', 'worried', 'nervous', 'scared', 'afraid', 'stressed'],
  neutral: ['okay', 'fine', 'alright', 'normal', 'regular'],
  grateful: ['grateful', 'thankful', 'blessed', 'appreciative'],
  hopeful: ['hope', 'looking forward', 'optimistic', 'better', 'improve'],
  overwhelmed: ['overwhelmed', 'too much', 'exhausted', 'cant handle', "can't handle"],
};

interface SentimentMetrics {
  emotion: {
    primary: string;
    confidence: number;
    distressLevel: number;
  };
  health: {
    wellnessScore: number;
    stressLevel: number;
  };
  context: {
    alliance: number;
  };
}

class SentimentAnalyzer {
  private static instance: SentimentAnalyzer;

  private constructor() {}

  static getInstance(): SentimentAnalyzer {
    if (!SentimentAnalyzer.instance) {
      SentimentAnalyzer.instance = new SentimentAnalyzer();
    }
    return SentimentAnalyzer.instance;
  }

  analyzeText(text: string): SentimentMetrics {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);
    
    // Count emotion occurrences
    const emotionScores = new Map<string, number>();
    let maxScore = 0;
    let primaryEmotion = 'neutral';

    for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
      const score = keywords.reduce((count, keyword) => {
        return count + (lowerText.includes(keyword) ? 1 : 0);
      }, 0);
      
      emotionScores.set(emotion, score);
      
      if (score > maxScore) {
        maxScore = score;
        primaryEmotion = emotion;
      }
    }

    // Calculate confidence based on emotion keyword matches
    const confidence = Math.min(1, maxScore / 3);

    // Calculate distress level
    const distressEmotions = ['sad', 'angry', 'anxious', 'overwhelmed'];
    const distressScore = distressEmotions.reduce((total, emotion) => {
      return total + (emotionScores.get(emotion) || 0);
    }, 0);
    const distressLevel = Math.min(1, distressScore / 5);

    // Calculate wellness metrics
    const positiveEmotions = ['happy', 'grateful', 'hopeful'];
    const positiveScore = positiveEmotions.reduce((total, emotion) => {
      return total + (emotionScores.get(emotion) || 0);
    }, 0);
    
    const wellnessScore = Math.max(0, Math.min(100, 50 + (positiveScore * 10) - (distressScore * 10)));
    const stressLevel = Math.max(0, Math.min(100, distressLevel * 100));

    // Estimate therapeutic alliance
    const allianceScore = this.estimateAlliance(text);

    return {
      emotion: {
        primary: primaryEmotion,
        confidence,
        distressLevel
      },
      health: {
        wellnessScore,
        stressLevel
      },
      context: {
        alliance: allianceScore
      }
    };
  }

  private estimateAlliance(text: string): number {
    const lowerText = text.toLowerCase();
    
    // Positive alliance markers
    const positiveMarkers = [
      'thank', 'helps', 'understand', 'good', 'better',
      'appreciate', 'support', 'listen', 'care', 'right'
    ];

    // Negative alliance markers
    const negativeMarkers = [
      'dont understand', "don't understand", 'unhelpful',
      'wrong', 'bad', 'waste', 'useless', 'stupid'
    ];

    const positiveCount = positiveMarkers.reduce((count, marker) => 
      count + (lowerText.includes(marker) ? 1 : 0), 0);
    
    const negativeCount = negativeMarkers.reduce((count, marker) =>
      count + (lowerText.includes(marker) ? 1 : 0), 0);

    // Base alliance score
    const baseScore = 75;
    
    // Adjust score based on markers
    const adjustedScore = baseScore + (positiveCount * 5) - (negativeCount * 10);
    
    // Ensure score stays within 0-100 range
    return Math.max(0, Math.min(100, adjustedScore));
  }
}

// Export singleton instance
export const sentimentAnalyzer = SentimentAnalyzer.getInstance();
