const { mapUserRow, mapAddressRow } = require('../src/routes/auth');

describe('mapUserRow', () => {
  test('should convert snake_case DB row to camelCase API object', () => {
    const row = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      phone: '555-0100',
      age_range: '25-34',
      preferred_language: 'English',
      cultural_interests: ['Christmas', 'Diwali'],
      dietary_preferences: ['Vegan'],
      loyalty_tier: 'Gold',
      loyalty_points: 150,
      order_history: ['order-1'],
      created_at: '2026-01-15'
    };

    const result = mapUserRow(row);

    expect(result.id).toBe('user-123');
    expect(result.email).toBe('test@example.com');
    expect(result.name).toBe('Test User');
    expect(result.phone).toBe('555-0100');
    expect(result.ageRange).toBe('25-34');
    expect(result.preferredLanguage).toBe('English');
    expect(result.culturalInterests).toEqual(['Christmas', 'Diwali']);
    expect(result.dietaryPreferences).toEqual(['Vegan']);
    expect(result.loyaltyTier).toBe('Gold');
    expect(result.loyaltyPoints).toBe(150);
    expect(result.orderHistory).toEqual(['order-1']);
    expect(result.createdAt).toBe('2026-01-15');
  });

  test('should default arrays to empty when null', () => {
    const row = {
      id: 'user-456',
      email: 'null@test.com',
      name: 'Null User',
      phone: '',
      age_range: '',
      preferred_language: 'English',
      cultural_interests: null,
      dietary_preferences: null,
      loyalty_tier: 'Bronze',
      loyalty_points: 0,
      order_history: null,
      created_at: '2026-03-01'
    };

    const result = mapUserRow(row);

    expect(result.culturalInterests).toEqual([]);
    expect(result.dietaryPreferences).toEqual([]);
    expect(result.orderHistory).toEqual([]);
  });

  test('should not include password in output', () => {
    const row = {
      id: 'user-789',
      email: 'secure@test.com',
      name: 'Secure User',
      password: '$2a$10$hashedpassword',
      phone: '',
      age_range: '',
      preferred_language: 'English',
      cultural_interests: [],
      dietary_preferences: [],
      loyalty_tier: 'Bronze',
      loyalty_points: 0,
      order_history: [],
      created_at: '2026-03-01'
    };

    const result = mapUserRow(row);
    expect(result).not.toHaveProperty('password');
  });
});

describe('mapAddressRow', () => {
  test('should convert snake_case address row to camelCase', () => {
    const row = {
      id: 'addr-1',
      label: 'Home',
      street: '123 Main St',
      city: 'Seattle',
      state: 'WA',
      zip: '98101',
      is_default: true
    };

    const result = mapAddressRow(row);

    expect(result.id).toBe('addr-1');
    expect(result.label).toBe('Home');
    expect(result.street).toBe('123 Main St');
    expect(result.city).toBe('Seattle');
    expect(result.state).toBe('WA');
    expect(result.zip).toBe('98101');
    expect(result.isDefault).toBe(true);
  });

  test('should handle false isDefault correctly', () => {
    const row = {
      id: 'addr-2',
      label: 'Work',
      street: '456 Office Blvd',
      city: 'Bellevue',
      state: 'WA',
      zip: '98004',
      is_default: false
    };

    const result = mapAddressRow(row);
    expect(result.isDefault).toBe(false);
  });
});
