import { SignEntry } from '../types';

export const SIGN_DICTIONARY: SignEntry[] = [
  {
    id: 'hello',
    word: 'Hello',
    gloss: 'HELLO',
    languages: ['ASL', 'ISL', 'BSL'],
    category: 'greetings',
    level: 'beginner',
    description: 'A friendly salute or wave gesture. In ASL, open hand moves outward from the temple like a casual salute. In ISL, palms join in Namaste or wave gracefully.',
    handshape: 'Open-B handshape (flat open hand, fingers together, thumb alongside).',
    movement: 'Starts near forehead/temple and arcs forward-right about 15-20cm.',
    nonManualMarkers: 'Warm smile, direct eye contact with the receiver.',
    grammarTip: 'In ASL/BSL, greetings often stand alone or precede the Topic in a discourse.',
    culturalNote: 'Eye contact is fundamental in Deaf culture before signing Hello to ensure attention.',
    avatarKeyframes: [
      {
        eyebrows: 'neutral',
        mouth: 'smile',
        headTilt: 0,
        leftHand: { x: 30, y: 70, shape: 'open5' },
        rightHand: { x: 65, y: 28, shape: 'flat', rotation: 15 },
        durationMs: 400
      },
      {
        eyebrows: 'neutral',
        mouth: 'smile',
        headTilt: 2,
        leftHand: { x: 30, y: 70, shape: 'open5' },
        rightHand: { x: 80, y: 35, shape: 'flat', rotation: -10 },
        durationMs: 600
      }
    ],
    regionalVariations: {
      ASL: 'Flat hand touches temple and arcs outward.',
      ISL: 'Both palms brought together in Namaste at chest level, or gentle right hand wave.',
      BSL: 'Right hand salutes from temple or waves open palm outward with two taps.'
    }
  },
  {
    id: 'thank-you',
    word: 'Thank You',
    gloss: 'THANK-YOU',
    languages: ['ASL', 'ISL', 'BSL'],
    category: 'greetings',
    level: 'beginner',
    description: 'Flat open hand touches the chin or lips and moves forward toward the person being thanked.',
    handshape: 'Flat B-handshape, fingers extended together, palm facing inward.',
    movement: 'Fingertips touch chin, then hand sweeps smoothly forward and down slightly toward listener.',
    nonManualMarkers: 'Head nod, warm appreciative facial expression.',
    grammarTip: 'The sign moves in the direction of the person you are thanking (directional verb).',
    avatarKeyframes: [
      {
        eyebrows: 'neutral',
        mouth: 'smile',
        leftHand: { x: 30, y: 70, shape: 'open5' },
        rightHand: { x: 50, y: 38, shape: 'flat', rotation: 0 },
        durationMs: 450
      },
      {
        eyebrows: 'neutral',
        mouth: 'smile',
        leftHand: { x: 30, y: 70, shape: 'open5' },
        rightHand: { x: 55, y: 55, shape: 'flat', rotation: -15 },
        durationMs: 650
      }
    ],
    regionalVariations: {
      ASL: 'Right flat hand moves from chin forward.',
      ISL: 'Flat hand touches chin and moves forward with a respectful slight head bow (Dhanyawad).',
      BSL: 'Fingertips touch chin and move forward, often with double tap.'
    }
  },
  {
    id: 'help',
    word: 'Help',
    gloss: 'HELP',
    languages: ['ASL', 'ISL', 'BSL'],
    category: 'emergency',
    level: 'beginner',
    description: 'A directional sign representing one hand lifting or assisting another in need.',
    handshape: 'Dominant hand in "A" handshape (thumbs-up fist) placed on flat open non-dominant palm.',
    movement: 'Both hands together elevate upward, indicating uplifting assistance. Can move toward receiver.',
    nonManualMarkers: 'Intense or concerned expression if urgent; eyebrows slightly raised or furrowed.',
    grammarTip: 'Highly directional: moving from signer to you means "I help you"; moving from you to signer means "You help me".',
    avatarKeyframes: [
      {
        eyebrows: 'furrowed',
        mouth: 'neutral',
        leftHand: { x: 42, y: 62, shape: 'flat', rotation: 0 },
        rightHand: { x: 46, y: 58, shape: 'thumbs_up', rotation: 0 },
        durationMs: 400
      },
      {
        eyebrows: 'raised',
        mouth: 'open',
        leftHand: { x: 42, y: 46, shape: 'flat', rotation: 0 },
        rightHand: { x: 46, y: 42, shape: 'thumbs_up', rotation: 0 },
        durationMs: 600
      }
    ],
    regionalVariations: {
      ASL: 'Left palm flat facing up, right thumbs-up fist rests on palm, lifting together.',
      ISL: 'Both hands open, palms facing up, lifting forward in a supportive motion.',
      BSL: 'Left flat hand facing up, right hand cups under or assists left hand moving upward.'
    }
  },
  {
    id: 'ambulance',
    word: 'Ambulance',
    gloss: 'AMBULANCE',
    languages: ['ASL', 'ISL', 'BSL'],
    category: 'emergency',
    level: 'beginner',
    description: 'Simulates the rotating or flashing emergency beacon light atop an emergency vehicle.',
    handshape: 'Open curved claw or C-handshape held near head level.',
    movement: 'Twists or opens and closes outward mimicking flashing rotating strobe beacons.',
    nonManualMarkers: 'Alert, urgent expression with wide eyes.',
    grammarTip: 'Often used with urgency non-manuals (fast repetitive execution).',
    avatarKeyframes: [
      {
        eyebrows: 'raised',
        mouth: 'round',
        leftHand: { x: 30, y: 35, shape: 'open5', rotation: -20 },
        rightHand: { x: 70, y: 35, shape: 'open5', rotation: 20 },
        durationMs: 400
      },
      {
        eyebrows: 'raised',
        mouth: 'open',
        leftHand: { x: 32, y: 32, shape: 'fist', rotation: 10 },
        rightHand: { x: 68, y: 32, shape: 'fist', rotation: -10 },
        durationMs: 400
      },
      {
        eyebrows: 'raised',
        mouth: 'round',
        leftHand: { x: 30, y: 35, shape: 'open5', rotation: -20 },
        rightHand: { x: 70, y: 35, shape: 'open5', rotation: 20 },
        durationMs: 400
      }
    ]
  },
  {
    id: 'doctor',
    word: 'Doctor',
    gloss: 'DOCTOR',
    languages: ['ASL', 'ISL', 'BSL'],
    category: 'emergency',
    level: 'beginner',
    description: 'Indicates taking a pulse on the wrist of the non-dominant hand.',
    handshape: 'Right hand bent fingers (M or D shape) tapping the inner wrist of outstretched left arm.',
    movement: 'Two distinct taps on the pulse area of the wrist.',
    nonManualMarkers: 'Attentive, neutral or inquiry expression.',
    grammarTip: 'Functions as a noun. In ASL compounds like DOCTOR VISIT (appointment).',
    avatarKeyframes: [
      {
        eyebrows: 'neutral',
        mouth: 'neutral',
        leftHand: { x: 40, y: 65, shape: 'flat', rotation: 45 },
        rightHand: { x: 42, y: 56, shape: 'pinch', rotation: -30 },
        durationMs: 450
      },
      {
        eyebrows: 'neutral',
        mouth: 'neutral',
        leftHand: { x: 40, y: 65, shape: 'flat', rotation: 45 },
        rightHand: { x: 42, y: 62, shape: 'pinch', rotation: -30 },
        durationMs: 350
      }
    ]
  },
  {
    id: 'hospital',
    word: 'Hospital',
    gloss: 'HOSPITAL',
    languages: ['ASL', 'ISL', 'BSL'],
    category: 'emergency',
    level: 'intermediate',
    description: 'Traces a symbolic medical cross on the upper arm or chest.',
    handshape: 'Index and middle fingers together (H handshape) or cross shape.',
    movement: 'Vertical stroke followed by horizontal stroke across shoulder/upper arm forming a cross.',
    nonManualMarkers: 'Neutral or solemn.',
    grammarTip: 'Location classifier often placed at the beginning of spatial topic sentences.',
    avatarKeyframes: [
      {
        eyebrows: 'neutral',
        mouth: 'neutral',
        leftHand: { x: 30, y: 70, shape: 'open5' },
        rightHand: { x: 32, y: 45, shape: 'peace', rotation: 0 },
        durationMs: 500
      },
      {
        eyebrows: 'neutral',
        mouth: 'neutral',
        leftHand: { x: 30, y: 70, shape: 'open5' },
        rightHand: { x: 32, y: 55, shape: 'peace', rotation: 0 },
        durationMs: 400
      }
    ]
  },
  {
    id: 'please',
    word: 'Please',
    gloss: 'PLEASE',
    languages: ['ASL', 'ISL', 'BSL'],
    category: 'greetings',
    level: 'beginner',
    description: 'Flat open hand rubs gently in a clockwise circle over the center of the chest.',
    handshape: 'Flat open hand, thumb along palm (B-handshape).',
    movement: 'Smooth circular motion over the sternum/heart.',
    nonManualMarkers: 'Pleading or gentle warm expression.',
    grammarTip: 'Placed either before the requested action or at the very end of the request sentence.',
    avatarKeyframes: [
      {
        eyebrows: 'raised',
        mouth: 'smile',
        leftHand: { x: 30, y: 70, shape: 'open5' },
        rightHand: { x: 48, y: 48, shape: 'flat', rotation: 0 },
        durationMs: 450
      },
      {
        eyebrows: 'raised',
        mouth: 'smile',
        leftHand: { x: 30, y: 70, shape: 'open5' },
        rightHand: { x: 54, y: 50, shape: 'flat', rotation: 10 },
        durationMs: 450
      }
    ]
  },
  {
    id: 'yes',
    word: 'Yes',
    gloss: 'YES',
    languages: ['ASL', 'ISL', 'BSL'],
    category: 'common',
    level: 'beginner',
    description: 'Fist nods up and down like a nodding human head.',
    handshape: 'S-handshape (closed fist with thumb across fingers).',
    movement: 'Wrist flexes nodding fist forward and downward twice.',
    nonManualMarkers: 'Nodding head concurrently.',
    grammarTip: 'Head nod must accompany the manual sign for grammatical agreement.',
    avatarKeyframes: [
      {
        eyebrows: 'neutral',
        mouth: 'smile',
        headTilt: -4,
        leftHand: { x: 30, y: 70, shape: 'open5' },
        rightHand: { x: 60, y: 45, shape: 'fist', rotation: -10 },
        durationMs: 350
      },
      {
        eyebrows: 'neutral',
        mouth: 'smile',
        headTilt: 4,
        leftHand: { x: 30, y: 70, shape: 'open5' },
        rightHand: { x: 60, y: 52, shape: 'fist', rotation: 20 },
        durationMs: 350
      }
    ]
  },
  {
    id: 'no',
    word: 'No',
    gloss: 'NO',
    languages: ['ASL', 'ISL', 'BSL'],
    category: 'common',
    level: 'beginner',
    description: 'Index and middle fingers snap shut onto the thumb like a closing mouth.',
    handshape: 'Extended index and middle finger with thumb open, then snapping together.',
    movement: 'Rapid closing of fingers against thumb.',
    nonManualMarkers: 'Head shake from side to side.',
    grammarTip: 'Negation is marked on the face simultaneously with the hand gesture.',
    avatarKeyframes: [
      {
        eyebrows: 'furrowed',
        mouth: 'neutral',
        headTilt: -6,
        leftHand: { x: 30, y: 70, shape: 'open5' },
        rightHand: { x: 60, y: 45, shape: 'peace', rotation: 0 },
        durationMs: 350
      },
      {
        eyebrows: 'furrowed',
        mouth: 'neutral',
        headTilt: 6,
        leftHand: { x: 30, y: 70, shape: 'open5' },
        rightHand: { x: 60, y: 46, shape: 'pinch', rotation: 0 },
        durationMs: 350
      }
    ]
  },
  {
    id: 'water',
    word: 'Water',
    gloss: 'WATER',
    languages: ['ASL', 'ISL', 'BSL'],
    category: 'food',
    level: 'beginner',
    description: 'W-handshape taps the chin twice, symbolizing sipping liquid.',
    handshape: 'W-handshape (index, middle, and ring fingers extended upward, thumb and pinky touching).',
    movement: 'Index finger lightly taps center of lower lip/chin twice.',
    nonManualMarkers: 'Slight puckering or neutral lips.',
    grammarTip: 'In ISL, cupped hand gesture near mouth or traditional Paani sign is common.',
    avatarKeyframes: [
      {
        eyebrows: 'neutral',
        mouth: 'round',
        leftHand: { x: 30, y: 70, shape: 'open5' },
        rightHand: { x: 50, y: 36, shape: 'peace', rotation: 0 },
        durationMs: 400
      },
      {
        eyebrows: 'neutral',
        mouth: 'round',
        leftHand: { x: 30, y: 70, shape: 'open5' },
        rightHand: { x: 50, y: 33, shape: 'peace', rotation: 0 },
        durationMs: 350
      }
    ]
  },
  {
    id: 'food',
    word: 'Food / Eat',
    gloss: 'EAT',
    languages: ['ASL', 'ISL', 'BSL'],
    category: 'food',
    level: 'beginner',
    description: 'Squashed O handshape taps the lips repeatedly, symbolizing bringing morsels to mouth.',
    handshape: 'Flat-O or pinched fingers with fingertips touching thumb.',
    movement: 'Taps the mouth twice (single motion for verb "EAT", double motion for noun "FOOD").',
    nonManualMarkers: 'Slight mouth opening or lip chew movement.',
    grammarTip: 'Noun-verb pair: Single movement = verb (to eat); Double movement = noun (food).',
    avatarKeyframes: [
      {
        eyebrows: 'neutral',
        mouth: 'open',
        leftHand: { x: 30, y: 70, shape: 'open5' },
        rightHand: { x: 50, y: 38, shape: 'pinch', rotation: 0 },
        durationMs: 400
      },
      {
        eyebrows: 'neutral',
        mouth: 'open',
        leftHand: { x: 30, y: 70, shape: 'open5' },
        rightHand: { x: 50, y: 34, shape: 'pinch', rotation: 0 },
        durationMs: 350
      }
    ]
  },
  {
    id: 'family',
    word: 'Family',
    gloss: 'FAMILY',
    languages: ['ASL', 'ISL', 'BSL'],
    category: 'family',
    level: 'intermediate',
    description: 'Both hands form "F" shapes with thumbs and index fingers touching, circling out and meeting at pinkies.',
    handshape: 'Two "F" hands (index & thumb touching in a ring, other three fingers open).',
    movement: 'Start touching at index/thumb in front of chest, arc outward in a circle, and finish touching pinkies.',
    nonManualMarkers: 'Warm, encompassing expression.',
    grammarTip: 'Class of initialization signs representing a collective group circle.',
    avatarKeyframes: [
      {
        eyebrows: 'neutral',
        mouth: 'smile',
        leftHand: { x: 42, y: 50, shape: 'pinch', rotation: 0 },
        rightHand: { x: 58, y: 50, shape: 'pinch', rotation: 0 },
        durationMs: 400
      },
      {
        eyebrows: 'neutral',
        mouth: 'smile',
        leftHand: { x: 34, y: 52, shape: 'pinch', rotation: -30 },
        rightHand: { x: 66, y: 52, shape: 'pinch', rotation: 30 },
        durationMs: 400
      },
      {
        eyebrows: 'neutral',
        mouth: 'smile',
        leftHand: { x: 46, y: 54, shape: 'pinch', rotation: 0 },
        rightHand: { x: 54, y: 54, shape: 'pinch', rotation: 0 },
        durationMs: 400
      }
    ]
  },
  {
    id: 'learn',
    word: 'Learn',
    gloss: 'LEARN',
    languages: ['ASL', 'ISL', 'BSL'],
    category: 'education',
    level: 'intermediate',
    description: 'Non-dominant palm is a book; dominant hand grabs information from the page and places it into forehead.',
    handshape: 'Non-dominant open flat palm facing up. Dominant starts flat-O, lifts and closes onto forehead.',
    movement: 'Smooth upward pulling gesture from palm straight to temple.',
    nonManualMarkers: 'Inquisitive, focused eyes.',
    grammarTip: 'Metaphorical concept sign: absorbing knowledge into the mind.',
    avatarKeyframes: [
      {
        eyebrows: 'raised',
        mouth: 'neutral',
        leftHand: { x: 45, y: 62, shape: 'flat', rotation: 0 },
        rightHand: { x: 46, y: 60, shape: 'open5', rotation: 0 },
        durationMs: 450
      },
      {
        eyebrows: 'neutral',
        mouth: 'smile',
        leftHand: { x: 45, y: 62, shape: 'flat', rotation: 0 },
        rightHand: { x: 58, y: 30, shape: 'pinch', rotation: 20 },
        durationMs: 550
      }
    ]
  },
  {
    id: 'friend',
    word: 'Friend',
    gloss: 'FRIEND',
    languages: ['ASL', 'ISL', 'BSL'],
    category: 'common',
    level: 'beginner',
    description: 'Both index fingers hook together once in one orientation, then reverse and hook the other way.',
    handshape: 'X-handshapes (hooked index fingers).',
    movement: 'Interlocking index fingers hook right over left, then left over right.',
    nonManualMarkers: 'Warm smile, friendly connection.',
    grammarTip: 'Symbolizes an unbreakable bond or link between two individuals.',
    avatarKeyframes: [
      {
        eyebrows: 'neutral',
        mouth: 'smile',
        leftHand: { x: 46, y: 52, shape: 'pointing', rotation: 45 },
        rightHand: { x: 54, y: 50, shape: 'pointing', rotation: -45 },
        durationMs: 450
      },
      {
        eyebrows: 'neutral',
        mouth: 'smile',
        leftHand: { x: 48, y: 50, shape: 'pointing', rotation: -45 },
        rightHand: { x: 52, y: 52, shape: 'pointing', rotation: 45 },
        durationMs: 450
      }
    ]
  },
  {
    id: 'danger',
    word: 'Danger / Emergency',
    gloss: 'EMERGENCY',
    languages: ['ASL', 'ISL', 'BSL'],
    category: 'emergency',
    level: 'advanced',
    description: 'E-handshape shakes frantically side to side in front of body, signaling urgent hazard.',
    handshape: 'E-handshape (curled fingers resting on thumb).',
    movement: 'Rapid horizontal vibrating wave motion.',
    nonManualMarkers: 'Widened eyes, tense body posture, alert eyebrows.',
    grammarTip: 'Precedes emergency descriptions to set maximum priority context.',
    avatarKeyframes: [
      {
        eyebrows: 'raised',
        mouth: 'round',
        leftHand: { x: 30, y: 70, shape: 'open5' },
        rightHand: { x: 50, y: 48, shape: 'fist', rotation: -15 },
        durationMs: 300
      },
      {
        eyebrows: 'raised',
        mouth: 'round',
        leftHand: { x: 30, y: 70, shape: 'open5' },
        rightHand: { x: 62, y: 48, shape: 'fist', rotation: 15 },
        durationMs: 300
      }
    ]
  }
];

export const QUIZ_QUESTIONS = [
  {
    id: 'quiz-1',
    signWord: 'Help',
    signLanguage: 'ASL' as const,
    level: 'beginner' as const,
    questionText: 'In American Sign Language (ASL), how is the fundamental sign for HELP formed?',
    options: [
      'Thumbs-up fist placed on open palm, lifting upward together',
      'Waving both open hands above the shoulders',
      'Tapping the index finger on the forehead twice',
      'Crossing arms across the chest in an X shape'
    ],
    correctAnswerIndex: 0,
    explanation: 'The sign HELP consists of the dominant hand in an "A" (thumbs-up) handshape resting on the flat, upward-facing non-dominant palm, lifting together in an uplifting gesture.',
    handshapeHint: 'Think of one hand physically supporting and lifting the other upward.'
  },
  {
    id: 'quiz-2',
    signWord: 'Thank You',
    signLanguage: 'ASL' as const,
    level: 'beginner' as const,
    questionText: 'What is the starting position of the dominant hand when signing THANK YOU in ASL and BSL?',
    options: [
      'At the chest over the heart',
      'At the chin or lower lips',
      'At the ear lobes',
      'At the opposite elbow'
    ],
    correctAnswerIndex: 1,
    explanation: 'THANK YOU begins with fingertips resting on the chin or lower lip and moves forward toward the person being thanked.',
    handshapeHint: 'Starting near the mouth emphasizes speech or gratitude coming from you.'
  },
  {
    id: 'quiz-3',
    signWord: 'Grammar',
    signLanguage: 'ASL' as const,
    level: 'intermediate' as const,
    questionText: 'What is the dominant sentence structure typically used in ASL for declarative sentences?',
    options: [
      'Subject - Verb - Object (SVO) identically to spoken English',
      'Topic - Comment (often Time - Topic - Comment)',
      'Verb - Object - Subject (VOS) always',
      'Random ordering with finger spelling'
    ],
    correctAnswerIndex: 1,
    explanation: 'ASL is a natural visual-spatial language with its own distinct grammar: Topic-Comment structure is fundamental, often establishing time first (e.g., TOMORROW STORE I GO).',
    handshapeHint: 'Sign languages establish what you are talking about first, then what happens to it.'
  },
  {
    id: 'quiz-4',
    signWord: 'Non-Manual Markers',
    signLanguage: 'ISL' as const,
    level: 'intermediate' as const,
    questionText: 'Why are Non-Manual Markers (facial expressions, head nods, eyebrow positions) critical in Sign Languages?',
    options: [
      'They are merely optional emotional decorations',
      'They serve essential grammatical functions like marking questions, negation, and emphasis',
      'They replace all hand movements',
      'They are only used in theater performances'
    ],
    correctAnswerIndex: 1,
    explanation: 'Non-manual markers are a required grammatical layer in ASL, ISL, and BSL. For example, raising eyebrows marks yes/no questions, while furrowing marks wh-questions.',
    handshapeHint: 'Facial expressions in sign language are equivalent to vocal tone and punctuation in spoken language.'
  },
  {
    id: 'quiz-5',
    signWord: 'Doctor',
    signLanguage: 'ASL' as const,
    level: 'beginner' as const,
    questionText: 'Which physical movement does the sign for DOCTOR evoke in ASL?',
    options: [
      'Taking a pulse on the inner wrist',
      'Listening with a stethoscope on the chest',
      'Injecting medicine into the shoulder',
      'Writing a prescription on a notepad'
    ],
    correctAnswerIndex: 0,
    explanation: 'DOCTOR is signed by tapping the bent fingers of the dominant hand twice on the pulse area of the non-dominant wrist.',
    handshapeHint: 'Think of a physician checking your heart rate at the wrist.'
  }
];
