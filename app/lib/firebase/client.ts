import { firestore, auth } from '@/app/services/firebase';

export function createClient() {
  return {
    firestore,
    auth,
    from: (collectionPath: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: {},
            error: null
          })
        }),
        match: () => ({
          single: async () => ({
            data: {},
            error: null
          })
        }),
        order: () => ({
          data: [],
          error: null
        })
      }),
      insert: () => ({
        data: { id: 'new-id' },
        error: null
      }),
      update: () => ({
        data: { id: 'updated-id' },
        error: null
      }),
      delete: () => ({
        error: null
      })
    })
  };
}

export function createRouteHandlerClient() {
  return createClient();
}

// For testing environment
if (process.env.NODE_ENV === 'test') {
  // Mock implementations for testing
  
  // @ts-expect-error - for testing purposes
  global.createClient = jest.fn().mockImplementation(() => ({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {},
        error: null
      }),
      data: null,
      error: null
    }),
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } }
      })
    }
  }));
  
  // @ts-expect-error - for testing purposes
  global.createRouteHandlerClient = jest.fn().mockImplementation(() => global.createClient());
}
