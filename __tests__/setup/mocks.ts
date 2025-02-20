export const createMockUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User'
  }
});

export const mockSupabaseClient = {
  auth: {
    signIn: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn()
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis()
  }))
};
