'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePos } from '@/context/PosContext';
import type { MenuItem } from '@/context/PosContext';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const categoryConfig: Record<MenuItem['category'], { label: string; chip: string; activeChip: string }> = {
  food: {
    label: 'Makanan',
    chip: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
    activeChip: 'bg-orange-500 text-white dark:bg-orange-500 dark:text-white',
  },
  drink: {
    label: 'Minuman',
    chip: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    activeChip: 'bg-sky-500 text-white dark:bg-sky-500 dark:text-white',
  },
  snack: {
    label: 'Snack',
    chip: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300',
    activeChip: 'bg-pink-500 text-white dark:bg-pink-500 dark:text-white',
  },
};

const categoryOrder: MenuItem['category'][] = ['food', 'drink', 'snack'];
const accentConfig = {
  emerald: {
    activeCard: 'border-emerald-300 bg-emerald-50/80 shadow-[0_12px_30px_rgba(16,185,129,0.12)] dark:border-emerald-500/30 dark:bg-emerald-500/10',
    activeLabel: 'text-emerald-700 dark:text-emerald-300',
    qtyBadge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    solidButton: 'bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400',
    softButton: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25',
  },
  orange: {
    activeCard: 'border-orange-300 bg-orange-50/80 shadow-[0_12px_30px_rgba(249,115,22,0.12)] dark:border-orange-500/30 dark:bg-orange-500/10',
    activeLabel: 'text-orange-700 dark:text-orange-300',
    qtyBadge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
    solidButton: 'bg-orange-600 text-white hover:bg-orange-500 dark:bg-orange-500 dark:hover:bg-orange-400',
    softButton: 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:hover:bg-orange-500/25',
  },
} as const;

interface MenuListProps {
  tableId?: number;
  searchQuery: string;
  onAdd?: (item: MenuItem) => void;
  onDecrease?: (item: MenuItem) => void;
  quantityByItemId?: Record<string, number>;
  accent?: keyof typeof accentConfig;
}

export default function MenuList({
  tableId,
  searchQuery,
  onAdd,
  onDecrease,
  quantityByItemId = {},
  accent = 'emerald',
}: MenuListProps) {
  const { menuItems, addOrderItem, updateOrderItemQuantity, ingredients } = usePos();
  const [activeCategory, setActiveCategory] = useState<'all' | MenuItem['category']>('all');
  const accentTone = accentConfig[accent];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const baseFilteredMenu = useMemo(
    () =>
      menuItems.filter(
        (item) =>
          item.name.toLowerCase().includes(normalizedQuery) ||
          item.description.toLowerCase().includes(normalizedQuery)
      ),
    [menuItems, normalizedQuery]
  );
  const filteredMenu = useMemo(
    () =>
      baseFilteredMenu
        .filter((item) => activeCategory === 'all' || item.category === activeCategory)
        .sort((a, b) => {
          const categoryDiff = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
          if (categoryDiff !== 0) return categoryDiff;
          return a.name.localeCompare(b.name);
        }),
    [activeCategory, baseFilteredMenu]
  );
  const categoryCounts = useMemo(
    () =>
      categoryOrder.reduce(
        (acc, category) => ({ ...acc, [category]: baseFilteredMenu.filter((item) => item.category === category).length }),
        { food: 0, drink: 0, snack: 0 } as Record<MenuItem['category'], number>
      ),
    [baseFilteredMenu]
  );

  const handleAdd = (item: MenuItem) => {
    if (onAdd) {
      onAdd(item);
      return;
    }
    if (typeof tableId === 'number') {
      addOrderItem(tableId, item);
    }
  };

  const handleDecrease = (item: MenuItem) => {
    if (onDecrease) {
      onDecrease(item);
      return;
    }
    if (typeof tableId === 'number') {
      const currentQuantity = quantityByItemId[item.id] ?? 0;
      updateOrderItemQuantity(tableId, item.id, currentQuantity - 1);
    }
  };

  const getStockStatus = (item: MenuItem): { status: 'ok' | 'low' | 'out'; label: string } => {
    if (!item.recipe || item.recipe.length === 0) return { status: 'ok', label: '' };

    let hasOut = false;
    let hasLow = false;

    for (const recipeItem of item.recipe) {
      const ingredient = ingredients.find((entry) => entry.id === recipeItem.ingredientId);
      if (!ingredient) continue;
      if (ingredient.stock <= 0) {
        hasOut = true;
        break;
      }
      if (ingredient.stock <= ingredient.minStock) {
        hasLow = true;
      }
    }

    if (hasOut) return { status: 'out', label: 'Stok Habis' };
    if (hasLow) return { status: 'low', label: 'Stok Tipis' };
    return { status: 'ok', label: '' };
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={cn(
            'rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors',
            activeCategory === 'all'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15'
          )}
        >
          Semua ({baseFilteredMenu.length})
        </button>
        {categoryOrder.map((category) => {
          const config = categoryConfig[category];
          const isActive = activeCategory === category;
          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                'rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors',
                isActive ? config.activeChip : config.chip
              )}
            >
              {config.label} ({categoryCounts[category]})
            </button>
          );
        })}
      </div>

      {filteredMenu.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 dark:border-white/15 dark:bg-white/5 dark:text-slate-400">
          Menu tidak ditemukan untuk filter ini.
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredMenu.map((item) => {
              const stockStatus = getStockStatus(item);
              const isDisabled = stockStatus.status === 'out';
              const config = categoryConfig[item.category];
              const quantity = quantityByItemId[item.id] ?? 0;
              const isSelected = quantity > 0;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  whileTap={!isDisabled ? { scale: 0.99 } : undefined}
                  role="button"
                  tabIndex={isDisabled ? -1 : 0}
                  onClick={() => !isDisabled && handleAdd(item)}
                  onKeyDown={(event) => {
                    if (isDisabled) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleAdd(item);
                    }
                  }}
                  className={cn(
                    'grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border bg-white px-3 py-2.5 text-left transition-colors outline-none dark:bg-slate-950/60',
                    isDisabled
                      ? 'cursor-not-allowed opacity-55'
                      : 'cursor-pointer hover:border-slate-300 dark:hover:border-white/20',
                    isSelected && accentTone.activeCard
                  )}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', config.chip)}>{config.label}</span>
                      {isSelected && (
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', accentTone.qtyBadge)}>
                          Sudah dipilih
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {stockStatus.status !== 'ok' && (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold',
                          stockStatus.status === 'out'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                        )}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {stockStatus.label}
                      </span>
                    )}
                    <p className="min-w-[92px] text-right text-sm font-bold text-slate-900 dark:text-slate-100">
                      {formatRupiah(item.price)}
                    </p>
                    {isSelected ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDecrease(item);
                          }}
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                            accentTone.softButton
                          )}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className={cn('min-w-[30px] text-center text-sm font-bold', accentTone.activeLabel)}>
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!isDisabled) handleAdd(item);
                          }}
                          disabled={isDisabled}
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                            accentTone.solidButton
                          )}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', accentTone.solidButton)}>
                        <Plus className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
