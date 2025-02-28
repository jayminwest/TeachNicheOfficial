/**
 * User restrictions service
 * 
 * Implements security measures to prevent abuse, including:
 * - Preventing new users from creating lessons within 48 hours of registration
 */

/**
 * Checks if a user is allowed to create a lesson based on their account age
 * @param userCreatedAt The timestamp when the user account was created
 * @returns Boolean indicating if the user can create a lesson
 */
export function canCreateLesson(userCreatedAt: Date | string | null): boolean {
  if (!userCreatedAt) return false;
  
  const creationDate = typeof userCreatedAt === 'string' 
    ? new Date(userCreatedAt) 
    : userCreatedAt;
    
  const now = new Date();
  const timeDifference = now.getTime() - creationDate.getTime();
  
  // 48 hours in milliseconds = 48 * 60 * 60 * 1000 = 172800000
  const minimumAccountAge = 172800000;
  
  return timeDifference >= minimumAccountAge;
}

/**
 * Calculates the remaining time until a user can create a lesson
 * @param userCreatedAt The timestamp when the user account was created
 * @returns Object with hours and minutes remaining, or null if user can already create lessons
 */
export function getTimeUntilCanCreateLesson(userCreatedAt: Date | string | null): { hours: number, minutes: number } | null {
  if (!userCreatedAt) return { hours: 48, minutes: 0 };
  
  const creationDate = typeof userCreatedAt === 'string' 
    ? new Date(userCreatedAt) 
    : userCreatedAt;
    
  const now = new Date();
  const timeDifference = now.getTime() - creationDate.getTime();
  
  // 48 hours in milliseconds
  const minimumAccountAge = 172800000;
  
  if (timeDifference >= minimumAccountAge) {
    return null; // User can already create lessons
  }
  
  const timeRemaining = minimumAccountAge - timeDifference;
  const hoursRemaining = Math.floor(timeRemaining / (60 * 60 * 1000));
  const minutesRemaining = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
  
  return {
    hours: hoursRemaining,
    minutes: minutesRemaining
  };
}
