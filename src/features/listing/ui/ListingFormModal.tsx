import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import type { Listing, ListingKind } from '@/entities/listing/model/types';
import type { PetCard } from '@/entities/pet/model/types';
import type { CreateListingBody, UpdateListingBody } from '@/api/types';
import {
  MAX_LISTING_PRICE_PER_DAY,
  parseListingPricePerDay,
  validateListingPricePerDay,
} from '@/entities/listing/lib/listingPriceLimits';
import {
  dateInputToExpiresAt,
  DEFAULT_LISTING_PUBLICATION_DAYS,
  expiresAtToDateInput,
  maxPublicationDateInput,
  minPublicationDateInput,
} from '@/entities/listing/lib/listingPublication';
import { Button } from '@/shared/ui/Button';
import { AuthAwareImg } from '@/shared/ui/AuthAwareImg';

/** Поля формы объявления */
type ListingFormData = {
  kind: ListingKind;
  title: string;
  description: string;
  city: string;
  priceRubPerDay: string;
  periodText: string;
  validUntil: string;
  contactPhone: string;
  contactTelegram: string;
  conditions: string;
  experience: string;
  petId: string;
};

const EMPTY_FORM: ListingFormData = {
  kind: 'offer_sitter',
  title: '',
  description: '',
  city: '',
  priceRubPerDay: '',
  periodText: '',
  validUntil: '',
  contactPhone: '',
  contactTelegram: '',
  conditions: '',
  experience: '',
  petId: '',
};

const CITIES = [
  'Москва',
  'Санкт-Петербург',
  'Новосибирск',
  'Екатеринбург',
  'Казань',
  'Нижний Новгород',
  'Челябинск',
  'Самара',
  'Омск',
  'Ростов-на-Дону',
  'Уфа',
  'Красноярск',
  'Пермь',
  'Воронеж',
  'Волгоград',
];

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (body: CreateListingBody | UpdateListingBody, isNew: boolean, coverFile?: File) => void;
  pending: boolean;
  /** Редактируемое объявление (если null — создание нового) */
  listing?: Listing | null;
  /** Питомцы пользователя для привязки */
  pets?: PetCard[];
  /** Флаг загрузки обложки */
  uploadingCover?: boolean;
};

/** Модалка создания/редактирования объявления */
export function ListingFormModal({ open, onClose, onSubmit, pending, listing, pets = [], uploadingCover }: Props) {
  const isEdit = Boolean(listing);
  const cityListId = useId();
  const coverInputRef = useRef<HTMLInputElement>(null);

  const initialForm = useMemo<ListingFormData>(() => {
    if (!listing) return EMPTY_FORM;
    return {
      kind: listing.kind,
      title: listing.title,
      description: listing.description,
      city: listing.city,
      priceRubPerDay: listing.priceRubPerDay != null ? String(listing.priceRubPerDay) : '',
      periodText: listing.periodText,
      validUntil: expiresAtToDateInput(listing.expiresAt),
      contactPhone: listing.contactPhone ?? '',
      contactTelegram: listing.contactTelegram ?? '',
      conditions: listing.conditions ?? '',
      experience: listing.experience ?? '',
      petId: listing.petId ?? '',
    };
  }, [listing]);

  const [form, setForm] = useState<ListingFormData>(initialForm);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initialForm);
      setPriceError(validateListingPricePerDay(initialForm.priceRubPerDay));
      setCoverFile(null);
      setCoverPreview(null);
    }
  }, [open, initialForm]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const handleChange = (field: keyof ListingFormData) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    if (field === 'priceRubPerDay') {
      setPriceError(validateListingPricePerDay(value));
    }
  };

  const handleCoverSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      const okType = /^image\/(jpeg|jpg|png|webp)$/i.test(file.type);
      const ext = (file.name.split('.').pop() ?? '').toLowerCase();
      const okExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
      if (!okType && !okExt) {
        alert('Допустимы только JPEG, PNG и WebP');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Изображение больше 5 МБ');
        return;
      }
      setCoverFile(file);
    }
  };

  const handleSubmit = () => {
    const priceValidation = validateListingPricePerDay(form.priceRubPerDay);
    if (priceValidation) {
      setPriceError(priceValidation);
      return;
    }
    const price = parseListingPricePerDay(form.priceRubPerDay);
    const body: CreateListingBody | UpdateListingBody = {
      ...(isEdit ? {} : { kind: form.kind === 'offer_sitter' ? 'OFFER_SITTER' : 'NEED_SITTER' }),
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      city: form.city.trim() || undefined,
      pricePerDay: price,
      periodText: form.periodText.trim() || undefined,
      expiresAt: dateInputToExpiresAt(form.validUntil),
      contactPhone: form.contactPhone.trim() || undefined,
      contactTelegram: form.contactTelegram.trim() || undefined,
      conditions: form.conditions.trim() || undefined,
      experience: form.experience.trim() || undefined,
      petId: form.petId || undefined,
    };
    onSubmit(body as CreateListingBody, !isEdit, coverFile ?? undefined);
  };

  const canSubmit = form.title.trim().length >= 5 && !priceError;

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-[2px]"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div
        className="relative z-[1] flex max-h-[min(94dvh,100%)] w-full max-w-2xl flex-col rounded-t-2xl border border-stone-200/90 bg-white shadow-2xl shadow-stone-900/20 ring-1 ring-stone-100 sm:max-h-[min(92vh,calc(100vh-2rem))] sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="listing-form-title"
      >
        <div className="shrink-0 border-b border-stone-100 px-6 pb-4 pt-6">
          <h2 id="listing-form-title" className="text-xl font-semibold leading-snug text-stone-900">
            {isEdit ? 'Редактирование объявления' : 'Новое объявление'}
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            {isEdit ? 'Измените данные и сохраните' : 'Заполните поля для создания объявления о передержке'}
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {!isEdit && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-stone-700">Тип объявления</legend>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="listing-kind"
                    value="offer_sitter"
                    checked={form.kind === 'offer_sitter'}
                    onChange={() => setForm((f) => ({ ...f, kind: 'offer_sitter' }))}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-stone-700">Предлагаю передержку</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="listing-kind"
                    value="need_sitter"
                    checked={form.kind === 'need_sitter'}
                    onChange={() => setForm((f) => ({ ...f, kind: 'need_sitter' }))}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-stone-700">Ищу передержку</span>
                </label>
              </div>
            </fieldset>
          )}

          <label className="block">
            <span className="text-sm font-medium text-stone-700">
              Заголовок <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              className="mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition"
              placeholder="Например: Передержка кошек в центре Москвы"
              value={form.title}
              onChange={handleChange('title')}
              maxLength={100}
              disabled={pending}
              autoFocus
            />
            <span className="mt-1 block text-xs text-stone-400">{form.title.length}/100</span>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">Описание</span>
            <textarea
              className="mt-1.5 min-h-[120px] w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition resize-y"
              placeholder="Расскажите подробнее об условиях, опыте, особенностях..."
              value={form.description}
              onChange={handleChange('description')}
              maxLength={2000}
              disabled={pending}
            />
            <span className="mt-1 block text-xs text-stone-400">{form.description.length}/2000</span>
          </label>

          <div className="space-y-2">
            <span className="block text-sm font-medium text-stone-700">Обложка объявления</span>
            <div className="flex items-start gap-4">
              <div className="relative h-32 w-48 shrink-0 overflow-hidden rounded-xl border-2 border-dashed border-stone-300 bg-stone-50">
                {coverPreview || listing?.coverImageUrl ? (
                  <>
                    {coverPreview ? (
                      <img src={coverPreview} alt="Предпросмотр" className="h-full w-full object-cover" />
                    ) : listing?.coverImageUrl ? (
                      <AuthAwareImg src={listing.coverImageUrl} alt="Обложка" className="h-full w-full object-cover" mediaAuthFallback />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setCoverFile(null);
                        setCoverPreview(null);
                      }}
                      disabled={pending || uploadingCover}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-stone-900/70 text-white hover:bg-stone-900 transition"
                      aria-label="Удалить обложку"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-stone-400">
                    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                    <span className="text-xs">Нет изображения</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handleCoverSelect}
                  disabled={pending || uploadingCover}
                />
                <Button
                  variant="secondary"
                  type="button"
                  className="text-sm"
                  disabled={pending || uploadingCover}
                  onClick={() => coverInputRef.current?.click()}
                >
                  {uploadingCover ? 'Загрузка...' : coverPreview || listing?.coverImageUrl ? 'Изменить' : 'Выбрать фото'}
                </Button>
                <span className="text-xs text-stone-400">JPEG, PNG, WebP до 5 МБ</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Город</span>
              <input
                type="text"
                list={cityListId}
                className="mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition"
                placeholder="Москва"
                value={form.city}
                onChange={handleChange('city')}
                maxLength={100}
                disabled={pending}
              />
              <datalist id={cityListId}>
                {CITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-stone-700">Цена за сутки, ₽</span>
              <input
                type="number"
                min="0"
                max={MAX_LISTING_PRICE_PER_DAY}
                step="100"
                className={`mt-1.5 w-full rounded-xl border px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 transition ${
                  priceError
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                    : 'border-stone-200 focus:border-amber-400 focus:ring-amber-200'
                }`}
                placeholder="1000"
                value={form.priceRubPerDay}
                onChange={handleChange('priceRubPerDay')}
                disabled={pending}
                aria-invalid={priceError ? true : undefined}
                aria-describedby={priceError ? 'listing-price-error' : 'listing-price-hint'}
              />
              {priceError ? (
                <p id="listing-price-error" className="mt-1 text-xs text-red-600">
                  {priceError}
                </p>
              ) : (
                <p id="listing-price-hint" className="mt-1 text-xs text-stone-400">
                  До {MAX_LISTING_PRICE_PER_DAY.toLocaleString('ru-RU')} ₽
                </p>
              )}
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">Период / даты</span>
            <input
              type="text"
              className="mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition"
              placeholder="По договорённости / 10-20 июня / круглый год"
              value={form.periodText}
              onChange={handleChange('periodText')}
              maxLength={255}
              disabled={pending}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">Снять с публикации (дата)</span>
            <input
              type="date"
              min={minPublicationDateInput()}
              max={maxPublicationDateInput()}
              className="mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition"
              value={form.validUntil}
              onChange={handleChange('validUntil')}
              disabled={pending}
            />
            <p className="mt-1 text-xs text-stone-400">
              Необязательно. Если пусто — объявление автоматически снимется через {DEFAULT_LISTING_PUBLICATION_DAYS}{' '}
              дней после публикации.
            </p>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Телефон для связи</span>
              <input
                type="tel"
                className="mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition"
                placeholder="+7 (999) 123-45-67"
                value={form.contactPhone}
                onChange={handleChange('contactPhone')}
                maxLength={30}
                disabled={pending}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-stone-700">Telegram</span>
              <input
                type="text"
                className="mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition"
                placeholder="@username"
                value={form.contactTelegram}
                onChange={handleChange('contactTelegram')}
                maxLength={50}
                disabled={pending}
              />
            </label>
          </div>

          {form.kind === 'offer_sitter' && (
            <>
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Условия содержания</span>
                <textarea
                  className="mt-1.5 min-h-[80px] w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition resize-y"
                  placeholder="Отдельная комната, наличие других животных, огороженный двор..."
                  value={form.conditions}
                  onChange={handleChange('conditions')}
                  maxLength={1000}
                  disabled={pending}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-stone-700">Опыт с животными</span>
                <textarea
                  className="mt-1.5 min-h-[80px] w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition resize-y"
                  placeholder="5 лет опыта передержки, ветеринарное образование..."
                  value={form.experience}
                  onChange={handleChange('experience')}
                  maxLength={1000}
                  disabled={pending}
                />
              </label>
            </>
          )}

          {form.kind === 'need_sitter' && pets.length > 0 && (
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Привязать питомца</span>
              <select
                className="mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition"
                value={form.petId}
                onChange={handleChange('petId')}
                disabled={pending}
              >
                <option value="">Не привязывать</option>
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} {pet.species ? `(${pet.species})` : ''}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-stone-400">
                Информация о питомце будет показана в объявлении
              </span>
            </label>
          )}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-stone-100 px-6 pb-6 pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" type="button" className="w-full sm:w-auto" disabled={pending} onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="primary"
            type="button"
            className="w-full sm:w-auto"
            disabled={pending || !canSubmit}
            onClick={handleSubmit}
          >
            {pending ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать объявление'}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
