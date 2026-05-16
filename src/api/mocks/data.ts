import type { ChatThread } from '@/entities/chat/model/types';
import type { Listing } from '@/entities/listing/model/types';
import type { PetCard } from '@/entities/pet/model/types';
import type { PublicProfile, Review } from '@/entities/user/model/types';

/** Текущий пользователь в демо (как будто вы вошли). */
export const MOCK_CURRENT_USER_ID = 'u-me';

/** Тематические фото (Unsplash), стабильные параметры crop/format. */
const ph = (path: string, w: number, h?: number) =>
  `https://images.unsplash.com/${path}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ''}&q=85`;

export const mockProfiles: Record<string, PublicProfile> = {
  'u-me': {
    id: 'u-me',
    displayName: 'Вы (демо)',
    avatarUrl: ph('photo-1535713875002-d1d0cf377fde', 200, 200),
    bio: 'Пробный профиль. Позже здесь данные с бэкенда.',
    galleryUrls: [ph('photo-1548199973-03cce0bbc87b', 900, 500)],
    roles: ['both'],
    ratingAvg: 5,
    reviewCount: 0,
  },
  u1: {
    id: 'u1',
    displayName: 'Марина К.',
    avatarUrl: ph('photo-1574158622682-e40e69881006', 200, 200),
    bio: 'Принимаю кошек и небольших собак. Есть отдельная комната, опыт 6 лет.',
    galleryUrls: [ph('photo-1514888286974-6c03e2ca1dba', 800, 520), ph('photo-1495360010541-f48722b34f7d', 800, 520)],
    roles: ['sitter'],
    ratingAvg: 4.8,
    reviewCount: 12,
  },
  u2: {
    id: 'u2',
    displayName: 'Алексей П.',
    avatarUrl: ph('photo-1507003211169-0a1dd7228f2d', 200, 200),
    bio: 'Ищу надёжную передержку для крупной собаки при командировках.',
    galleryUrls: [ph('photo-1587300003388-59208cc962cb', 800, 520)],
    roles: ['seeker'],
    ratingAvg: 4.2,
    reviewCount: 5,
  },
};

export const mockPets: Record<string, PetCard[]> = {
  u2: [
    {
      id: 'p1',
      name: 'Арчи',
      species: 'Лабрадор',
      avatarUrl: ph('photo-1587300003388-59208cc962cb', 400, 400),
      description: 'Дружелюбный, любит воду и длительные прогулки.',
      habits: 'Корм 2 раза в день, после еды отдых 1 час. Не любит одиночество.',
      vaccinations: 'Бешенство, комплекс — актуально до 08.2026',
      allergies: 'Нет',
      vetNotes: 'Суставы под наблюдением — без высоких прыжков.',
    },
  ],
  'u-me': [],
  u1: [],
};

export const mockListings: Listing[] = [
  {
    id: 'l1',
    authorId: 'u1',
    kind: 'offer_sitter',
    title: 'Передержка кошек, Запад Москвы',
    description: 'Спокойная квартира без других животных. Фотоотчёт раз в день. Встреча перед стартом обязательна.',
    city: 'Москва',
    priceRubPerDay: 900,
    periodText: 'По договорённости',
    coverImageUrl: ph('photo-1514888286974-6c03e2ca1dba', 1200, 720),
  },
  {
    id: 'l2',
    authorId: 'u2',
    kind: 'need_sitter',
    title: 'Нужна передержка лабратора ~10 дней',
    description: 'Командировка с 3 по 14 июня. Нужен опыт с крупными собаками.',
    city: 'Москва',
    periodText: '03.06 — 14.06',
    coverImageUrl: ph('photo-1587300003388-59208cc962cb', 1200, 720),
    petId: 'p1',
  },
  {
    id: 'l3',
    authorId: 'u1',
    kind: 'offer_sitter',
    title: 'Загородный дом с участком для собак',
    description: 'Огороженный двор, выгул 3 раза в день. Приму средних и крупных пород по предварительному знакомству.',
    city: 'Одинцово',
    priceRubPerDay: 1400,
    periodText: 'Май — сентябрь',
    coverImageUrl: ph('photo-1548199973-03cce0bbc87b', 1200, 720),
  },
  {
    id: 'l4',
    authorId: 'u2',
    kind: 'need_sitter',
    title: 'Две кошки на время ремонта (~2 недели)',
    description: 'Нужен опытный человек без собак дома. Лотки и переноски предоставим.',
    city: 'Москва',
    periodText: 'Июль, даты гибкие',
    coverImageUrl: ph('photo-1573865526739-10aa826cbf78', 1200, 720),
  },
];

export const mockReviewsByUser: Record<string, Review[]> = {
  u1: [
    {
      id: 'r1',
      authorId: 'u2',
      authorName: 'Алексей П.',
      rating: 5,
      text: 'Марина бережно отнеслась к питомцу, всё чётко по договорённости.',
      createdAt: '2026-04-12',
    },
    {
      id: 'r2',
      authorId: 'u-me',
      authorName: 'Вы (демо)',
      rating: 4,
      text: 'Хорошая передержка, единственное — чуть далеко от метро.',
      createdAt: '2026-03-01',
    },
  ],
  u2: [
    {
      id: 'r3',
      authorId: 'u1',
      authorName: 'Марина К.',
      rating: 5,
      text: 'Алексей предоставил полную информацию о собаке, вопросов не было.',
      createdAt: '2026-02-20',
    },
  ],
  'u-me': [],
};

/** Начальные демо-чаты (остальные создаются по кнопке «Написать»). */
export const mockInitialChats: ChatThread[] = [
  {
    id: 'dm-u-me-u1',
    participantIds: ['u-me', 'u1'],
    messages: [
      {
        id: 'm1',
        senderId: 'u1',
        body: 'Здравствуйте! Могу ответить на вопросы по передержке.',
        sentAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
  },
];
