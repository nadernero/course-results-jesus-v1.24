export interface Servant {
  code: string;
  name: string;
  mobileNumber: string;
  primaryService: string;
  allServices?: string[];
  avatarUrl?: string;
}

export interface CourseResult {
  servantCode: string;
  courseName: string;
  score: number | 'غائب';
  attendance: number; // Stored as percentage, e.g., 85 for 85%
  year: number;
  date?: string; // Optional full date (e.g. 2024-10-15)
}

// Represents a servant's evaluation in a specific service
export interface Evaluation {
    id: string; // Document ID from Firestore
    servantCode: string;
    serviceName: string;
    year: number;
    evaluatorName: string;
    scores: {
        spiritualLife: number;
        commitment: number;
        preparationAndDelivery: number;
        relationshipWithPeers: number;
        relationshipWithCongregation: number;
        personalGrowth: number;
    };
    overallAverage: number;
    generalNotes?: string;
}

// Combined type for search results
export interface FullStudentProfile {
    servant: Servant;
    results: CourseResult[];
    evaluations: Evaluation[];
}

// Type for the flattened list used in the admin panel
export interface StudentResult {
  code: string;
  name: string;
  mobileNumber: string;
  courseName: string;
  score: number | 'غائب';
  attendance: number;
// FIX: Add 'service' property to align with its usage in DetailsModal and AIChatView. This resolves the compile-time error.
  service: string;
  date?: string;
}