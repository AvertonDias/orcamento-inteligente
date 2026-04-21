
"use client";

import React, { useState, useMemo } from 'react';
import { DashboardSummary } from '@/components/DashboardSummary';
import { TransactionTable } from '@/components/TransactionTable';
import { CSVImporter } from '@/components/CSVImporter';
import { TransactionDialog } from '@/components/TransactionDialog';
import { TransactionFilters } from '@/components/TransactionFilters';
import { FinanceChart } from '@/components/FinanceChart';
import { AnnualSummaryView } from '@/components/AnnualSummaryView';
import { Transaction } from '@/app/lib/types';
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
  EyeOff
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
  useCollection 
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
  writeBatch
} from 'firebase/firestore';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { useMemoFirebase } from '@/firebase/firestore/use-collection';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

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

  const transactionsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('date', 'desc')
    );
  }, [db, user]);

  const { data: transactions = [], loading: dataLoading } = useCollection(transactionsQuery);

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
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setAuthError(err.message);
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
            {authError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{authError}</AlertDescription></Alert>}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Senha</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
              <Button type="submit" className="w-full" disabled={isAuthProcessing}>{isAuthProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}{authMode === 'login' ? 'Entrar' : 'Criar Conta'}</Button>
            </form>
            <Separator />
            <Button variant="outline" className="w-full gap-2" onClick={handleGoogleLogin} disabled={isAuthProcessing}>Google</Button>
          </CardContent>
          <CardFooter><Button variant="link" className="w-full" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>{authMode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}</Button></CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2"><div className="bg-primary p-1.5 rounded-lg"><LayoutDashboard className="h-5 w-5 text-white" /></div><h1 className="text-xl font-bold text-primary">Orçamento Inteligente</h1></div>
          <div className="flex items-center gap-3"><TransactionDialog onAdd={handleAdd} /><CSVImporter onImport={handleImport} /><Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="h-4 w-4" /></Button></div>
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
          <TabsList className="mb-6"><TabsTrigger value="dashboard"><List className="h-4 w-4 mr-2" />Lançamentos</TabsTrigger><TabsTrigger value="annual"><BarChart3 className="h-4 w-4 mr-2" />Resumo Anual</TabsTrigger></TabsList>
          
          <TabsContent value="dashboard" className="space-y-8">
            <DashboardSummary transactions={filteredActive} />
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <TransactionFilters search={search} setSearch={setSearch} category={categoryFilter} setCategory={setCategoryFilter} type={typeFilter} setType={setTypeFilter} onClear={clearFilters} />
                <TransactionTable transactions={filteredActive} onUpdate={handleUpdate} onDelete={handleDelete} onIgnoreSimilar={handleIgnoreSimilar} />
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
                />
              </section>
            )}
          </TabsContent>

          <TabsContent value="annual"><AnnualSummaryView transactions={activeTransactions} /></TabsContent>
        </Tabs>
      </main>
      <Toaster />
    </div>
  );
}
