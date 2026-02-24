// This is a comprehensive mock Supabase client that implements the necessary
// interface to keep the frontend working without a real Supabase backend.

const mockUser = {
  id: 'mock-user-id',
  email: 'admin@smartmove.rw',
  user_metadata: { full_name: 'Smart Move Admin' },
  role: 'authenticated',
  app_metadata: { provider: 'email' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: mockUser,
};

// Generic mock implementation of Supabase Query Builder
class MockQueryBuilder {
  private table: string;
  private data: any[];

  constructor(table: string) {
    this.table = table;
    // Initial static data to prevent empty screens
    if (table === 'cars') {
      this.data = [
        { id: 'toyota-land-cruiser', name: 'Toyota Land Cruiser', type: 'SUV', seats: 7, status: 'available', pricePerHour: 50, pricePerDay: 300, features: ['4WD', 'AC'], image: 'https://images.unsplash.com/photo-1594611110477-6cc9da17e33f?w=800' },
        { id: 'mercedes-s-class', name: 'Mercedes S-Class', type: 'Luxury Sedan', seats: 5, status: 'available', pricePerHour: 80, pricePerDay: 450, features: ['Leather Seats'], image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800' },
        { id: 'toyota-hiace', name: 'Toyota HiAce', type: 'Van', seats: 14, status: 'available', pricePerHour: 40, pricePerDay: 200, features: ['Spacious'], image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800' },
        { id: 'range-rover-sport', name: 'Range Rover Sport', type: 'SUV', seats: 5, status: 'available', pricePerHour: 70, pricePerDay: 400, features: ['Premium Sound'], image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800' },
        { id: 'toyota-corolla', name: 'Toyota Corolla', type: 'Sedan', seats: 5, status: 'available', pricePerHour: 25, pricePerDay: 120, features: ['Fuel Efficient'], image: 'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=800' },
      ];
    } else if (table === 'notifications') {
      this.data = [
        { id: '1', title: 'Welcome Admin', message: 'You have successfully logged into the mock system.', type: 'info', is_read: false, created_at: new Date().toISOString() },
        { id: '2', title: 'System Status', message: 'The backend is currently running in local mock mode.', type: 'success', is_read: true, created_at: new Date(Date.now() - 3600000).toISOString() },
      ];
    } else if (table === 'pricing_rules') {
      this.data = [
        { id: 'p1', car_id: '1', pricing_type: 'hour', amount: 50, location: 'Kigali City', notes: 'Standard rate' },
        { id: 'p2', car_id: '1', pricing_type: 'day', amount: 300, location: 'Kigali City', notes: 'Daily discount' },
        { id: 'p3', car_id: '2', pricing_type: 'hour', amount: 80, location: 'Airport', notes: 'VIP service' },
        { id: 'p4', car_id: '3', pricing_type: 'trip', amount: 150, location: 'Musanze', notes: 'One way trip' },
        { id: 'p5', car_id: '4', pricing_type: 'day', amount: 400, location: 'Across Rwanda', notes: 'Includes driver' },
      ];
    } else {
      this.data = [];
    }
  }

  select(columns?: string) { return this; }
  order(column: string, options?: any) { return this; }
  eq(column: string, value: any) { return this; }
  neq(column: string, value: any) { return this; }
  gt(column: string, value: any) { return this; }
  lt(column: string, value: any) { return this; }
  gte(column: string, value: any) { return this; }
  lte(column: string, value: any) { return this; }
  like(column: string, pattern: string) { return this; }
  ilike(column: string, pattern: string) { return this; }
  is(column: string, value: any) { return this; }
  in(column: string, values: any[]) { return this; }
  contains(column: string, value: any) { return this; }
  containedBy(column: string, value: any) { return this; }
  range(from: number, to: number) { return this; }
  single() { return this; }
  limit(n: number) { return this; }

  async insert(values: any | any[]) {
    return { data: Array.isArray(values) ? values : [values], error: null };
  }

  update(values: any) {
    return this;
  }

  upsert(values: any | any[]) {
    return this;
  }

  delete() {
    return this;
  }

  // Support for direct await (thenable)
  then(onfulfilled?: (value: any) => any) {
    return Promise.resolve({ data: this.data, error: null }).then(onfulfilled);
  }
}

// Mock Realtime Channel
class MockChannel {
  on(event: string, filter: any, callback: any) { return this; }
  subscribe() { return this; }
  unsubscribe() { return Promise.resolve(); }
}

export const supabase: any = {
  auth: {
    getSession: async () => ({ data: { session: mockSession }, error: null }),
    getUser: async () => ({ data: { user: mockUser }, error: null }),
    signInWithPassword: async () => ({ data: { user: mockUser, session: mockSession }, error: null }),
    signUp: async () => ({ data: { user: mockUser, session: mockSession }, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: (callback: any) => {
      // Trigger an immediate initial state
      setTimeout(() => callback('SIGNED_IN', mockSession), 0);
      return { data: { subscription: { unsubscribe: () => { } } } };
    },
    setSession: async (tokens: any) => ({ data: { user: mockUser, session: mockSession }, error: null }),
  },
  from: (table: string) => new MockQueryBuilder(table),
  rpc: async (name: string, args?: any) => {
    if (name === 'has_role') return { data: true, error: null };
    return { data: null, error: null };
  },
  channel: (name: string) => new MockChannel(),
  removeChannel: (channel: any) => Promise.resolve(),
  removeAllChannels: () => Promise.resolve(),
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => {
        // Simulated upload: return a blob URL
        const url = URL.createObjectURL(file);
        return { data: { path: url }, error: null };
      },
      getPublicUrl: (path: string) => ({ data: { publicUrl: path.startsWith('blob:') ? path : 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800' } }),
      list: async () => ({ data: [], error: null }),
      remove: async () => ({ data: [], error: null }),
    }),
  },
};