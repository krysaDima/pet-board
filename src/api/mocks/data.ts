import type { ChatThread } from '@/entities/chat/model/types';
import { makeDmChatId } from '@/entities/chat/lib/makeDmChatId';
import type { Listing } from '@/entities/listing/model/types';
import type { PetCard } from '@/entities/pet/model/types';
import type { PublicProfile, Review } from '@/entities/user/model/types';

/** «Я» в демо-моках: валидный UUID — совместим с `AuthResponse.userId` и `/users/{uuid}/profile`. */
export const MOCK_CURRENT_USER_ID = '11111111-1111-4111-a111-111111111111';
export const DEMO_USER_MARINA = '22222222-2222-4222-a222-222222222222';
export const DEMO_USER_ALEXEY = '33333333-3333-4333-a333-333333333333';

/** Тематические фото (Unsplash), стабильные параметры crop/format. */
const ph = (path: string, w: number, h?: number) =>
  `https://images.unsplash.com/${path}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ''}&q=85`;

export const mockProfiles: Record<string, PublicProfile> = {
  [MOCK_CURRENT_USER_ID]: {
    id: MOCK_CURRENT_USER_ID,
    displayName: 'Вы (демо)',
    avatarUrl: ph('photo-1535713875002-d1d0cf377fde', 200, 200),
    bio: 'Пробный профиль. Позже здесь данные с бэкенда.',
    galleryUrls: [ph('photo-1548199973-03cce0bbc87b', 900, 500)],
    roles: ['both'],
    ratingAvg: 5,
    reviewCount: 0,
  },
  [DEMO_USER_MARINA]: {
    id: DEMO_USER_MARINA,
    displayName: 'Марина К.',
    avatarUrl: ph('photo-1574158622682-e40e69881006', 200, 200),
    bio: 'Принимаю кошек и небольших собак. Есть отдельная комната, опыт 6 лет.',
    galleryUrls: [ph('photo-1514888286974-6c03e2ca1dba', 800, 520), ph('photo-1495360010541-f48722b34f7d', 800, 520)],
    roles: ['sitter'],
    ratingAvg: 4.8,
    reviewCount: 12,
  },
  [DEMO_USER_ALEXEY]: {
    id: DEMO_USER_ALEXEY,
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
  [DEMO_USER_ALEXEY]: [
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
  [MOCK_CURRENT_USER_ID]: [],
  [DEMO_USER_MARINA]: [],
};

export const mockListings: Listing[] = [
  {
    id: 'l1',
    authorId: DEMO_USER_MARINA,
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
    authorId: DEMO_USER_ALEXEY,
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
    authorId: DEMO_USER_MARINA,
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
    authorId: DEMO_USER_ALEXEY,
    kind: 'need_sitter',
    title: 'Две кошки на время ремонта (~2 недели)',
    description: 'Нужен опытный человек без собак дома. Лотки и переноски предоставим.',
    city: 'Москва',
    periodText: 'Июль, даты гибкие',
    coverImageUrl: ph('photo-1573865526739-10aa826cbf78', 1200, 720),
  },
];

export const mockReviewsByUser: Record<string, Review[]> = {
  [DEMO_USER_MARINA]: [
    {
      id: 'r1',
      authorId: DEMO_USER_ALEXEY,
      authorName: 'Алексей П.',
      rating: 5,
      text: 'Марина бережно отнеслась к питомцу, всё чётко по договорённости.',
      createdAt: '2026-04-12',
    },
    {
      id: 'r2',
      authorId: MOCK_CURRENT_USER_ID,
      authorName: 'Вы (демо)',
      rating: 4,
      text: 'Хорошая передержка, единственное — чуть далеко от метро.',
      createdAt: '2026-03-01',
    },
  ],
  [DEMO_USER_ALEXEY]: [
    {
      id: 'r3',
      authorId: DEMO_USER_MARINA,
      authorName: 'Марина К.',
      rating: 5,
      text: 'Алексей предоставил полную информацию о собаке, вопросов не было.',
      createdAt: '2026-02-20',
    },
  ],
  [MOCK_CURRENT_USER_ID]: [],
};

/** Начальные демо-чаты (остальные создаются по кнопке «Написать»). */
export const mockInitialChats: ChatThread[] = [
  {
    id: makeDmChatId(MOCK_CURRENT_USER_ID, DEMO_USER_MARINA),
    participantIds: [MOCK_CURRENT_USER_ID, DEMO_USER_MARINA].sort(),
    messages: [
      {
        id: 'm1',
        senderId: DEMO_USER_MARINA,
        body: 'Здравствуйте! Могу ответить на вопросы по передержке.',
        sentAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
  },
];
