/* ── Platform-level fake data for super-admin ── */

export const FAKE_PLATFORM_STATS = {
  total_restaurants: 142,
  active_restaurants: 118,
  pending_restaurants: 7,
  total_users: 24_830,
  active_users_today: 1_247,
  total_couriers: 312,
  online_couriers: 87,
  today_orders: 1_483,
  today_revenue: 267_400_000,
  today_commission: 40_110_000,
  avg_order: 180_243,
  platform_rating: 4.7,
  week_orders: 9_841,
  week_revenue: 1_771_380_000,
  month_orders: 41_200,
  month_revenue: 7_416_000_000,
};

export const FAKE_CHART = [
  { day: 'Dush', orders: 1320, revenue: 237_600_000, commission: 35_640_000 },
  { day: 'Sesh', orders: 1180, revenue: 212_400_000, commission: 31_860_000 },
  { day: 'Chor', orders: 1560, revenue: 280_800_000, commission: 42_120_000 },
  { day: 'Pay',  orders: 1740, revenue: 313_200_000, commission: 46_980_000 },
  { day: 'Jum',  orders: 1480, revenue: 266_400_000, commission: 39_960_000 },
  { day: 'Shan', orders: 2100, revenue: 378_000_000, commission: 56_700_000 },
  { day: 'Yak',  orders: 1050, revenue: 189_000_000, commission: 28_350_000 },
];

export const FAKE_RESTAURANTS = [
  { id: 1, name: 'Bee Burger', owner: 'Sherzod Aliyev', phone: '+998901234567', address: 'Amir Temur 12, Toshkent', status: 'active', rating: 4.8, total_orders: 3412, revenue: 614_160_000, commission_rate: 15, created_at: '2024-06-15T10:00:00Z', logo_url: null },
  { id: 2, name: 'Pizza Palace', owner: 'Nodira Karimova', phone: '+998937654321', address: 'Yunusobod 4, Novza 12', status: 'active', rating: 4.6, total_orders: 2891, revenue: 520_380_000, commission_rate: 15, created_at: '2024-07-20T08:00:00Z', logo_url: null },
  { id: 3, name: 'Lavash House', owner: 'Aziz Mirzayev', phone: '+998951112233', address: 'Sergeli 7A, Toshkent', status: 'active', rating: 4.5, total_orders: 1876, revenue: 337_680_000, commission_rate: 12, created_at: '2024-08-10T12:00:00Z', logo_url: null },
  { id: 4, name: 'Sushi Master', owner: 'Malika Toshmatova', phone: '+998991234567', address: 'Mirzo Ulug\'bek 1', status: 'active', rating: 4.9, total_orders: 4210, revenue: 757_800_000, commission_rate: 15, created_at: '2024-05-01T09:00:00Z', logo_url: null },
  { id: 5, name: 'Choyxona #1', owner: 'Sardor Bobojonov', phone: '+998907776655', address: 'Olmazor, Beruniy 5', status: 'active', rating: 4.3, total_orders: 987, revenue: 177_660_000, commission_rate: 12, created_at: '2024-09-25T14:00:00Z', logo_url: null },
  { id: 6, name: 'King Kebab', owner: 'Dilnoza Rahimova', phone: '+998941234567', address: 'Shayxontohur, Labzak 10', status: 'pending', rating: 0, total_orders: 0, revenue: 0, commission_rate: 15, created_at: '2026-02-28T16:00:00Z', logo_url: null },
  { id: 7, name: 'Fresh Salads', owner: 'Otabek Yusupov', phone: '+998335556677', address: 'Chilonzor 19, 5-uy', status: 'pending', rating: 0, total_orders: 0, revenue: 0, commission_rate: 12, created_at: '2026-03-01T11:00:00Z', logo_url: null },
  { id: 8, name: 'Burger King UZ', owner: 'Jasur Qodirov', phone: '+998901122334', address: 'Toshkent, Amir Temur 108', status: 'suspended', rating: 3.2, total_orders: 234, revenue: 42_120_000, commission_rate: 15, created_at: '2025-01-10T08:00:00Z', logo_url: null },
  { id: 9, name: 'Domino\'s Clone', owner: 'Zafar Ismoilov', phone: '+998955544332', address: 'Mirzo Ulug\'bek, Qoratosh 3', status: 'active', rating: 4.4, total_orders: 1543, revenue: 277_740_000, commission_rate: 15, created_at: '2024-11-05T10:00:00Z', logo_url: null },
  { id: 10, name: 'Taco Bell UZ', owner: 'Kamola Nazarova', phone: '+998917778899', address: 'Yakkasaroy, Shota Rustaveli 22', status: 'active', rating: 4.1, total_orders: 678, revenue: 122_040_000, commission_rate: 12, created_at: '2025-04-18T13:00:00Z', logo_url: null },
];

export const FAKE_ALL_ORDERS = [
  { id: 10841, restaurant: 'Bee Burger', status: 'created', created_at: new Date(Date.now() - 60000).toISOString(), customer: 'Sherzod A.', courier: null, total: 115_000, payment: 'cash' },
  { id: 10840, restaurant: 'Pizza Palace', status: 'preparing', created_at: new Date(Date.now() - 300000).toISOString(), customer: 'Nodira K.', courier: null, total: 167_000, payment: 'card' },
  { id: 10839, restaurant: 'Sushi Master', status: 'ready', created_at: new Date(Date.now() - 600000).toISOString(), customer: 'Aziz M.', courier: 'Bobur T.', total: 234_000, payment: 'card' },
  { id: 10838, restaurant: 'Lavash House', status: 'on_the_way', created_at: new Date(Date.now() - 900000).toISOString(), customer: 'Malika T.', courier: 'Jasur Q.', total: 111_000, payment: 'cash' },
  { id: 10837, restaurant: 'Bee Burger', status: 'delivered', created_at: new Date(Date.now() - 1800000).toISOString(), customer: 'Sardor B.', courier: 'Alisher N.', total: 104_000, payment: 'card' },
  { id: 10836, restaurant: 'Choyxona #1', status: 'delivered', created_at: new Date(Date.now() - 2400000).toISOString(), customer: 'Dilnoza R.', courier: 'Bobur T.', total: 89_000, payment: 'cash' },
  { id: 10835, restaurant: 'Pizza Palace', status: 'cancelled', created_at: new Date(Date.now() - 3600000).toISOString(), customer: 'Otabek Y.', courier: null, total: 63_000, payment: 'card' },
  { id: 10834, restaurant: 'Sushi Master', status: 'delivered', created_at: new Date(Date.now() - 5400000).toISOString(), customer: 'Kamola N.', courier: 'Jasur Q.', total: 312_000, payment: 'card' },
  { id: 10833, restaurant: 'Domino\'s Clone', status: 'delivered', created_at: new Date(Date.now() - 7200000).toISOString(), customer: 'Zafar I.', courier: 'Alisher N.', total: 178_000, payment: 'cash' },
  { id: 10832, restaurant: 'Bee Burger', status: 'cancelled', created_at: new Date(Date.now() - 9000000).toISOString(), customer: 'Jasur Q.', courier: null, total: 52_000, payment: 'cash' },
  { id: 10831, restaurant: 'Taco Bell UZ', status: 'delivered', created_at: new Date(Date.now() - 10800000).toISOString(), customer: 'Sherzod A.', courier: 'Bobur T.', total: 95_000, payment: 'card' },
  { id: 10830, restaurant: 'Lavash House', status: 'delivered', created_at: new Date(Date.now() - 14400000).toISOString(), customer: 'Nodira K.', courier: 'Jasur Q.', total: 128_000, payment: 'card' },
];

export const FAKE_USERS = [
  { id: 1, name: 'Sherzod Aliyev', phone: '+998901234567', email: 'sherzod@mail.uz', orders_count: 47, total_spent: 8_460_000, status: 'active', created_at: '2024-06-20T10:00:00Z' },
  { id: 2, name: 'Nodira Karimova', phone: '+998937654321', email: 'nodira@gmail.com', orders_count: 32, total_spent: 5_760_000, status: 'active', created_at: '2024-07-15T08:00:00Z' },
  { id: 3, name: 'Aziz Mirzayev', phone: '+998951112233', email: 'aziz.m@mail.uz', orders_count: 18, total_spent: 3_240_000, status: 'active', created_at: '2024-08-01T12:00:00Z' },
  { id: 4, name: 'Malika Toshmatova', phone: '+998991234567', email: 'malika.t@gmail.com', orders_count: 65, total_spent: 11_700_000, status: 'active', created_at: '2024-05-10T09:00:00Z' },
  { id: 5, name: 'Sardor Bobojonov', phone: '+998907776655', email: 'sardor.b@mail.uz', orders_count: 8, total_spent: 1_440_000, status: 'active', created_at: '2024-09-28T14:00:00Z' },
  { id: 6, name: 'Dilnoza Rahimova', phone: '+998941234567', email: 'dilnoza@gmail.com', orders_count: 23, total_spent: 4_140_000, status: 'blocked', created_at: '2024-10-05T16:00:00Z' },
  { id: 7, name: 'Otabek Yusupov', phone: '+998335556677', email: 'otabek.y@mail.uz', orders_count: 41, total_spent: 7_380_000, status: 'active', created_at: '2024-11-12T11:00:00Z' },
  { id: 8, name: 'Kamola Nazarova', phone: '+998917778899', email: 'kamola.n@gmail.com', orders_count: 12, total_spent: 2_160_000, status: 'active', created_at: '2025-01-20T08:00:00Z' },
  { id: 9, name: 'Jasur Qodirov', phone: '+998901122334', email: 'jasur.q@mail.uz', orders_count: 3, total_spent: 540_000, status: 'active', created_at: '2025-03-15T10:00:00Z' },
  { id: 10, name: 'Zafar Ismoilov', phone: '+998955544332', email: 'zafar.i@gmail.com', orders_count: 56, total_spent: 10_080_000, status: 'active', created_at: '2024-04-22T13:00:00Z' },
];

export const FAKE_COURIERS = [
  { id: 1, name: 'Bobur Tursunov', phone: '+998901001010', vehicle: 'motorcycle', status: 'online', total_deliveries: 1247, rating: 4.9, today_deliveries: 12, balance: 840_000, created_at: '2024-06-01T08:00:00Z' },
  { id: 2, name: 'Alisher Navoiy', phone: '+998932002020', vehicle: 'bicycle', status: 'busy', total_deliveries: 834, rating: 4.7, today_deliveries: 8, balance: 560_000, created_at: '2024-07-15T09:00:00Z' },
  { id: 3, name: 'Jasur Qodirov', phone: '+998953003030', vehicle: 'car', status: 'online', total_deliveries: 2103, rating: 4.8, today_deliveries: 15, balance: 1_120_000, created_at: '2024-05-20T10:00:00Z' },
  { id: 4, name: 'Firdavs Kamolov', phone: '+998994004040', vehicle: 'motorcycle', status: 'offline', total_deliveries: 567, rating: 4.5, today_deliveries: 0, balance: 320_000, created_at: '2024-09-10T11:00:00Z' },
  { id: 5, name: 'Sanjar Ergashev', phone: '+998905005050', vehicle: 'motorcycle', status: 'online', total_deliveries: 1890, rating: 4.6, today_deliveries: 11, balance: 780_000, created_at: '2024-06-25T08:00:00Z' },
  { id: 6, name: 'Ulugbek Razzaqov', phone: '+998916006060', vehicle: 'bicycle', status: 'busy', total_deliveries: 432, rating: 4.4, today_deliveries: 5, balance: 240_000, created_at: '2025-01-05T12:00:00Z' },
  { id: 7, name: 'Doston Mahmudov', phone: '+998947007070', vehicle: 'car', status: 'offline', total_deliveries: 3210, rating: 4.9, today_deliveries: 0, balance: 1_540_000, created_at: '2024-03-15T07:00:00Z' },
  { id: 8, name: 'Bekzod Ahmedov', phone: '+998338008080', vehicle: 'motorcycle', status: 'online', total_deliveries: 1123, rating: 4.3, today_deliveries: 9, balance: 620_000, created_at: '2024-08-20T09:00:00Z' },
];

export const FAKE_FINANCE = {
  today: { revenue: 267_400_000, commission: 40_110_000, payouts: 227_290_000, pending: 12_450_000 },
  week:  { revenue: 1_771_380_000, commission: 265_707_000, payouts: 1_505_673_000, pending: 45_200_000 },
  month: { revenue: 7_416_000_000, commission: 1_112_400_000, payouts: 6_303_600_000, pending: 124_500_000 },
};

export const FAKE_PAYOUTS = [
  { id: 1, restaurant: 'Sushi Master', amount: 12_400_000, status: 'completed', date: '2026-03-01T18:00:00Z' },
  { id: 2, restaurant: 'Bee Burger', amount: 8_900_000, status: 'completed', date: '2026-03-01T17:00:00Z' },
  { id: 3, restaurant: 'Pizza Palace', amount: 7_200_000, status: 'pending', date: '2026-03-02T10:00:00Z' },
  { id: 4, restaurant: 'Lavash House', amount: 4_100_000, status: 'pending', date: '2026-03-02T10:00:00Z' },
  { id: 5, restaurant: 'Domino\'s Clone', amount: 5_600_000, status: 'completed', date: '2026-02-28T18:00:00Z' },
  { id: 6, restaurant: 'Choyxona #1', amount: 2_800_000, status: 'completed', date: '2026-02-28T17:00:00Z' },
  { id: 7, restaurant: 'Taco Bell UZ', amount: 3_200_000, status: 'failed', date: '2026-02-27T18:00:00Z' },
];

export const FAKE_PLATFORM_SETTINGS = {
  platform_name: 'Bee Express',
  commission_rate: 15,
  min_commission_rate: 10,
  max_commission_rate: 25,
  base_delivery_fee: 15_000,
  free_delivery_threshold: 200_000,
  min_order_amount: 20_000,
  max_delivery_radius_km: 10,
  courier_base_pay: 8_000,
  courier_per_km_pay: 2_000,
  support_phone: '+998712000000',
  support_email: 'support@beeexpress.uz',
};
