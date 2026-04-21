
"use client";

import React, { useState, useMemo } from 'react';
import { DashboardSummary } from '@/components/DashboardSummary';
import { TransactionTable } from '@/components/TransactionTable';
import { TransactionFilters } from '@/components/TransactionFilters';
import { FinanceChart } from '@/components/FinanceChart';
import { AnnualSummaryView } from '@/components/AnnualSummaryView';
import { AuthView } from '@/components/AuthView';
import { MainHeader } from '@/components/MainHeader';
import { MonthSelector } from '@/components/MonthSelector';
import { SettingsView } from '@/components/SettingsView';
import { MonthlyAdjustments } from '@/components/MonthlyAdjustments';
import { Transaction, DEFAULT_CATEGORIES } from '@/app/lib/types';
import { Toaster } from '@/components/ui/toaster';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2,
  EyeOff
} from 'lucide-react';
import { 
  useUser, 
  useFirestore, 
  useAuth, 
  useCollection,
  useDoc,
  useMemoFirebase
} from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  doc, 
  deleteDoc, 
  updateDoc, 
  addDoc,
  serverTimestamp,
  writeBatch,
  setDoc
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const { user, isUserLoading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState<number | 'annual'>(new Date().getMonth());

  const yearMonthKey = useMemo(() => {
    const year = new Date().getFullYear();
    const month = typeof selectedMonth === 'number' ? (selectedMonth + 1).toString().padStart(2, '0') : '';
    return month ? `${year}-${month}` : '';
  }, [selectedMonth]);

  const transactionsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('date', 'desc')
    );
  }, [db, user]);

  const { data: transactionsData, isLoading: dataLoading } = useCollection(transactionsQuery);
  const transactions = useMemo(() => transactionsData || [], [transactionsData]);

  const settingsRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid, 'settings', 'config');
  }, [db, user]);

  const { data: settings } = useDoc(settingsRef);

  const categories = useMemo(() => {
    const cats = settings?.categories || DEFAULT_CATEGORIES;
    return [...cats].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [settings]);

  const ignoredDescriptions = useMemo(() => settings?.ignoredDescriptions || [], [settings]);

  const activeTransactions = useMemo(() => transactions.filter(t => !t.isIgnored), [transactions]);
  const ignoredTransactions = useMemo(() => transactions.filter(t => t.isIgnored), [transactions]);

  const filteredActive = useMemo(() => {
    return activeTransactions.filter((t) => {
      const dateObj = new Date(t.date);
      const matchesMonth = typeof selectedMonth === 'number' ? dateObj.getMonth() === selectedMonth : true;
      const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) || 
                            t.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      return matchesMonth && matchesSearch && matchesCategory && matchesType;
    });
  }, [activeTransactions, selectedMonth, search, categoryFilter, typeFilter]);

  const filteredIgnored = useMemo(() => {
    return ignoredTransactions.filter((t) => {
      const dateObj = new Date(t.date);
      const matchesMonth = typeof selectedMonth === 'number' ? dateObj.getMonth() === selectedMonth : true;
      const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase());
      return matchesMonth && matchesSearch;
    });
  }, [ignoredTransactions, selectedMonth, search]);

  const handleAdd = (data: Omit<Transaction, 'id'>) => {
    if (!db || !user) return;
    const colRef = collection(db, 'users', user.uid, 'transactions');
    const isAutoIgnored = ignoredDescriptions.includes(data.description);
    
    addDoc(colRef, {
      ...data,
      userId: user.uid,
      isIgnored: isAutoIgnored,
      createdAt: serverTimestamp()
    }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'create', requestResourceData: data }));
    });
  };

  const handleImport = (newTransactions: Transaction[]) => {
    if (!db || !user) return;
    const colRef = collection(db, 'users', user.uid, 'transactions');
    
    const existingFingerprints = new Set(
      transactions.map(t => `${t.date}_${t.description.trim()}_${t.amount.toFixed(2)}_${t.bank}_${t.type}`)
    );

    const uniqueNewOnes = newTransactions.filter(t => {
      const fingerprint = `${t.date}_${t.description.trim()}_${t.amount.toFixed(2)}_${t.bank}_${t.type}`;
      return !existingFingerprints.has(fingerprint);
    });

    if (uniqueNewOnes.length === 0) {
      toast({
        title: "Nenhuma transação nova",
        description: "Todas as transações do arquivo já foram importadas anteriormente."
      });
      return;
    }

    uniqueNewOnes.forEach(t => {
      const isAutoIgnored = ignoredDescriptions.includes(t.description);
      addDoc(colRef, {
        ...t,
        userId: user.uid,
        isIgnored: isAutoIgnored,
        createdAt: serverTimestamp()
      }).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'create', requestResourceData: t }));
      });
    });

    toast({
      title: "Importação concluída",
      description: `${uniqueNewOnes.length} novas transações adicionadas.`
    });
  };

  const handleUpdate = (id: string, updates: Partial<Transaction>) => {
    if (!db || !user) return;
    const docRef = doc(db, 'users', user.uid, 'transactions', id);
    updateDoc(docRef, updates).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: updates }));
    });
  };

  const handleDelete = (id: string) => {
    if (!db || !user) return;
    const docRef = doc(db, 'users', user.uid, 'transactions', id);
    deleteDoc(docRef).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
    });
  };

  const handleUpdateSimilarCategory = async (description: string, category: string) => {
    if (!db || !user) return;
    const similar = transactions.filter(t => t.description === description && t.category !== category);
    if (similar.length === 0) return;

    const batch = writeBatch(db);
    similar.forEach(t => {
      const docRef = doc(db, 'users', user.uid, 'transactions', t.id);
      batch.update(docRef, { category });
    });

    try {
      await batch.commit();
      toast({
        title: "Atualização em massa",
        description: `${similar.length} transações similares foram atualizadas.`
      });
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao atualizar" });
    }
  };

  const handleIgnoreSimilar = async (description: string) => {
    if (!db || !user || !settingsRef) return;
    
    if (!ignoredDescriptions.includes(description)) {
      const updated = [...ignoredDescriptions, description];
      setDoc(settingsRef, { ignoredDescriptions: updated }, { merge: true });
    }

    const similar = transactions.filter(t => t.description === description && !t.isIgnored);
    if (similar.length === 0) return;

    const batch = writeBatch(db);
    similar.forEach(t => {
      const docRef = doc(db, 'users', user.uid, 'transactions', t.id);
      batch.update(docRef, { isIgnored: true });
    });

    try {
      await batch.commit();
      toast({ title: "Ignore Permanente", description: `"${description}" será ignorado em todos os meses, incluindo futuros.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao ignorar" });
    }
  };

  const handleAddCategory = (name: string) => {
    if (!settingsRef) return;
    const updatedCategories = [...categories, name];
    setDoc(settingsRef, { categories: updatedCategories }, { merge: true });
    toast({ title: "Categoria adicionada" });
  };

  const handleRemoveCategory = (cat: string) => {
    if (!settingsRef) return;
    const updatedCategories = categories.filter(c => c !== cat);
    setDoc(settingsRef, { categories: updatedCategories }, { merge: true });
    toast({ title: "Categoria removida" });
  };

  const handleResetCategories = () => {
    if (!settingsRef) return;
    setDoc(settingsRef, { categories: DEFAULT_CATEGORIES }, { merge: true });
    toast({ title: "Categorias resetadas" });
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setTypeFilter('all');
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!user) return <AuthView auth={auth} />;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <MainHeader 
        auth={auth} 
        categories={categories} 
        onAdd={handleAdd} 
        onImport={handleImport} 
      />

      <Tabs defaultValue="dashboard" className="w-full flex flex-col flex-1">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 pt-4">
            <TabsList className="bg-slate-100 p-1">
              <TabsTrigger value="dashboard" className="px-6">Meus Lançamentos</TabsTrigger>
              <TabsTrigger value="settings" className="px-6">Configurações</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="dashboard" className="flex-1 flex flex-col m-0">
          <MonthSelector 
            selectedMonth={selectedMonth} 
            onSelect={setSelectedMonth} 
          />

          <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
            {selectedMonth === 'annual' ? (
              <AnnualSummaryView transactions={activeTransactions} />
            ) : (
              <div className="space-y-12">
                <DashboardSummary transactions={filteredActive} />
                
                {/* Novas Calculadoras e Ajustes Mensais */}
                {yearMonthKey && (
                  <MonthlyAdjustments yearMonth={yearMonthKey} />
                )}

                <div className="grid gap-8 lg:grid-cols-3 pt-8 border-t">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-xl font-bold text-slate-800">Transações Detalhadas</h2>
                    </div>
                    <TransactionFilters 
                      search={search} setSearch={setSearch} 
                      category={categoryFilter} setCategory={setCategoryFilter} 
                      type={typeFilter} setType={setTypeFilter} 
                      onClear={clearFilters} categories={categories}
                    />
                    {dataLoading ? (
                      <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : (
                      <TransactionTable 
                        transactions={filteredActive} onUpdate={handleUpdate} onDelete={handleDelete} 
                        onIgnoreSimilar={handleIgnoreSimilar} onUpdateSimilarCategory={handleUpdateSimilarCategory}
                        categories={categories}
                      />
                    )}
                  </div>
                  <aside>
                    <FinanceChart transactions={filteredActive} />
                  </aside>
                </div>

                {ignoredTransactions.length > 0 && filteredIgnored.length > 0 && (
                  <section className="pt-12 mt-12 border-t">
                    <div className="flex items-center gap-2 mb-6 text-slate-400">
                      <EyeOff className="h-5 w-5" />
                      <h2 className="text-lg font-semibold">Transações Ignoradas (Mês Selecionado)</h2>
                    </div>
                    <TransactionTable 
                      transactions={filteredIgnored} onUpdate={handleUpdate} onDelete={handleDelete}
                      isIgnoredList={true} categories={categories}
                    />
                  </section>
                )}
              </div>
            )}
          </main>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 m-0">
          <main className="max-w-7xl mx-auto w-full px-4 py-8">
            <SettingsView 
              user={user} 
              categories={categories} 
              onAddCategory={handleAddCategory} 
              onRemoveCategory={handleRemoveCategory} 
              onResetCategories={handleResetCategories} 
            />
          </main>
        </TabsContent>
      </Tabs>
      <Toaster />
    </div>
  );
}
