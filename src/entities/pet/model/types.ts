/** Карточка питомца у заказчика (что должен знать ситтер). */
export type PetCard = {
  id: string;
  name: string;
  species: string;
  /** Возраст как ввёл пользователь, например «2 года». */
  age: string;
  avatarUrl: string;
  description: string;
  habits: string;
  vaccinations: string;
  allergies: string;
  vetNotes?: string;
};
