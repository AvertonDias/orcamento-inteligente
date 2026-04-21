"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { DashboardSummary } from '@/components/DashboardSummary';
import { TransactionTable } from '@/components/TransactionTable';
import { CSVImporter } from '@/components/CSVImporter';
import { TransactionDialog } from '@/components/TransactionDialog';
import { TransactionFilters } from '@/components/TransactionFilters';
import { FinanceChart } from '@/components/FinanceChart';
import { AnnualSummaryView } from '@/components/AnnualSummaryView';
import { Transaction, DEFAULT_CATEGORIES } from '@/app/lib/types';
import { Toaster } from '@/components/ui/toaster';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PieChart, 
  List, 
  LayoutDashboard, 
  LogOut,
  Loader2,
  Calendar as CalendarIcon,
  LogIn,
  Mail,
  Lock,
  BarChart3,
  AlertCircle,
  EyeOff,
  Settings as SettingsIcon,
  Tag,
  Plus,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  useUser, 
  useFirestore, 
  useAuth, 
  useCollection,
  useDoc
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
import { useMemoFirebase } from '@/firebase/firestore/use-collection';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function Home() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(new Date().getMonth());

  // Auth States
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Settings State
  const [newCategoryName, setNewCategoryName] = useState('');

  const transactionsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('date', 'desc')
    );
  }, [db, user]);

  const { data: transactions = [], loading: dataLoading } = useCollection(transactionsQuery);

  // User Settings
  const settingsRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid, 'settings', 'config');
  }, [db, user]);

  const { data: settings } = useDoc(settingsRef);

  const categories = useMemo(() => {
    return settings?.categories || DEFAULT_CATEGORIES;
  }, [settings]);

  const activeTransactions = useMemo(() => transactions.filter(t => !t.isIgnored), [transactions]);
  const ignoredTransactions = useMemo(() => transactions.filter(t => t.isIgnored), [transactions]);

  const filteredActive = useMemo(() => {
    return activeTransactions.filter((t) => {
      const dateObj = new Date(t.date);
      const matchesMonth = selectedMonth === 'all' || dateObj.getMonth() === selectedMonth;
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
      const matchesMonth = selectedMonth === 'all' || dateObj.getMonth() === selectedMonth;
      const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase());
      return matchesMonth && matchesSearch;
    });
  }, [ignoredTransactions, selectedMonth, search]);

  const handleGoogleLogin = async () => {
    if (!auth) {
      setAuthError("Configuração do Firebase pendente.");
      return;
    }
    setIsAuthProcessing(true);
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError("O pop-up de login foi fechado. Se ele fechar sozinho, verifique se o domínio do site está autorizado no console do Firebase.");
      } else if (err.code === 'auth/api-key-not-valid') {
        setAuthError("Chave de API inválida. Verifique sua configuração no arquivo de configuração do Firebase.");
      } else {
        setAuthError(err.message || "Não foi possível realizar o login com Google.");
      }
    } finally {
      setIsAuthProcessing(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsAuthProcessing(true);
    setAuthError(null);
    try {
      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsAuthProcessing(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    signOut(auth);
  };

  const handleAdd = (data: Omit<Transaction, 'id'>) => {
    if (!db || !user) return;
    const colRef = collection(db, 'users', user.uid, 'transactions');
    addDoc(colRef, {
      ...data,
      userId: user.uid,
      isIgnored: false,
      createdAt: serverTimestamp()
    }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'create', requestResourceData: data }));
    });
  };

  const handleImport = (newTransactions: Transaction[]) => {
    if (!db || !user) return;
    const colRef = collection(db, 'users', user.uid, 'transactions');
    newTransactions.forEach(t => {
      addDoc(colRef, {
        ...t,
        userId: user.uid,
        isIgnored: false,
        createdAt: serverTimestamp()
      }).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'create', requestResourceData: t }));
      });
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

  const handleIgnoreSimilar = async (description: string) => {
    if (!db || !user) return;
    const similar = transactions.filter(t => t.description === description && !t.isIgnored);
    if (similar.length === 0) return;

    const batch = writeBatch(db);
    similar.forEach(t => {
      const docRef = doc(db, 'users', user.uid, 'transactions', t.id);
      batch.update(docRef, { isIgnored: true });
    });

    try {
      await batch.commit();
      toast({
        title: "Atualização concluída",
        description: `${similar.length} transações similares foram movidas para ignoradas.`
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao ignorar",
        description: "Não foi possível atualizar as transações."
      });
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim() || !settingsRef) return;
    const updatedCategories = [...categories, newCategoryName.trim()];
    setDoc(settingsRef, { categories: updatedCategories }, { merge: true });
    setNewCategoryName('');
    toast({ title: "Categoria adicionada", description: `"${newCategoryName}" agora está disponível.` });
  };

  const handleRemoveCategory = (cat: string) => {
    if (!settingsRef) return;
    const updatedCategories = categories.filter(c => c !== cat);
    setDoc(settingsRef, { categories: updatedCategories }, { merge: true });
    toast({ title: "Categoria removida", description: `"${cat}" foi removida da sua lista.` });
  };

  const handleResetCategories = () => {
    if (!settingsRef) return;
    setDoc(settingsRef, { categories: DEFAULT_CATEGORIES }, { merge: true });
    toast({ title: "Categorias resetadas", description: "Sua lista voltou ao padrão do sistema." });
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setTypeFilter('all');
    setSelectedMonth('all');
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <Card className="max-w-md w-full shadow-xl border-none">
          <CardHeader className="text-center space-y-4">
            <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
              <LayoutDashboard className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Orçamento Inteligente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {authError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                  id="email"
                  type="email" 
                  autoComplete="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password"
                  type="password" 
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>
              <Button type="submit" className="w-full" disabled={isAuthProcessing}>
                {isAuthProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                {authMode === 'login' ? 'Entrar' : 'Criar Conta'}
              </Button>
            </form>
            <Separator />
            <Button variant="outline" className="w-full gap-2" onClick={handleGoogleLogin} disabled={isAuthProcessing}>
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
          </CardContent>
          <CardFooter>
            <Button variant="link" className="w-full" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
              {authMode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2"><div className="bg-primary p-1.5 rounded-lg"><LayoutDashboard className="h-5 w-5 text-white" /></div><h1 className="text-xl font-bold text-primary">Orçamento Inteligente</h1></div>
          <div className="flex items-center gap-3"><TransactionDialog onAdd={handleAdd} categories={categories} /><CSVImporter onImport={handleImport} /><Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="h-4 w-4" /></Button></div>
        </div>
      </header>

      <div className="bg-slate-800 text-white overflow-x-auto border-b">
        <div className="max-w-7xl mx-auto px-4 flex">
          <button onClick={() => setSelectedMonth('all')} className={cn("px-4 py-3 text-sm font-medium border-b-2 border-transparent", selectedMonth === 'all' && "border-primary text-primary")}>Todos</button>
          {MONTHS.map((month, index) => (<button key={month} onClick={() => setSelectedMonth(index)} className={cn("px-4 py-3 text-sm font-medium border-b-2 border-transparent", selectedMonth === index && "border-primary text-primary")}>{month}</button>))}
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard"><List className="h-4 w-4 mr-2" />Lançamentos</TabsTrigger>
            <TabsTrigger value="annual"><BarChart3 className="h-4 w-4 mr-2" />Resumo Anual</TabsTrigger>
            <TabsTrigger value="settings"><SettingsIcon className="h-4 w-4 mr-2" />Configurações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-8">
            <DashboardSummary transactions={filteredActive} />
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <TransactionFilters 
                  search={search} 
                  setSearch={setSearch} 
                  category={categoryFilter} 
                  setCategory={setCategoryFilter} 
                  type={typeFilter} 
                  setType={setTypeFilter} 
                  onClear={clearFilters}
                  categories={categories}
                />
                <TransactionTable 
                  transactions={filteredActive} 
                  onUpdate={handleUpdate} 
                  onDelete={handleDelete} 
                  onIgnoreSimilar={handleIgnoreSimilar} 
                  categories={categories}
                />
              </div>
              <aside><FinanceChart transactions={filteredActive} /></aside>
            </div>

            {ignoredTransactions.length > 0 && (
              <section className="pt-12 mt-12 border-t">
                <div className="flex items-center gap-2 mb-6 text-slate-400">
                  <EyeOff className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Transações Ignoradas (Inúteis)</h2>
                </div>
                <TransactionTable 
                  transactions={filteredIgnored} 
                  onUpdate={handleUpdate} 
                  onDelete={handleDelete}
                  isIgnoredList={true}
                  categories={categories}
                />
              </section>
            )}
          </TabsContent>

          <TabsContent value="annual">
            <AnnualSummaryView transactions={activeTransactions} />
          </TabsContent>

          <TabsContent value="settings">
            <div className="max-w-4xl grid gap-6 md:grid-cols-2">
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="h-5 w-5 text-primary" />
                      Minhas Categorias
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleResetCategories} className="h-8 text-xs gap-1">
                      <RotateCcw className="h-3 w-3" />
                      Resetar
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Adicione ou remova categorias para organizar seus gastos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Nova categoria..." 
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    />
                    <Button onClick={handleAddCategory} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {categories.map(cat => (
                      <Badge key={cat} variant="secondary" className="px-3 py-1 text-sm font-medium flex items-center gap-1 group">
                        {cat}
                        <button 
                          onClick={() => handleRemoveCategory(cat)}
                          className="hover:text-destructive text-muted-foreground ml-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl">Perfil do Usuário</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="text-lg font-bold truncate max-w-[200px]">{user?.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Toaster />
    </div>
  );
}
