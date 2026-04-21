
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
  BarChart3
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
  serverTimestamp
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

  const transactionsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('date', 'desc')
    );
  }, [db, user]);

  const { data: transactions = [], loading: dataLoading } = useCollection(transactionsQuery);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const dateObj = new Date(t.date);
      const matchesMonth = selectedMonth === 'all' || dateObj.getMonth() === selectedMonth;
      const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) || 
                            t.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      return matchesMonth && matchesSearch && matchesCategory && matchesType;
    });
  }, [transactions, selectedMonth, search, categoryFilter, typeFilter]);

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setIsAuthProcessing(true);
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .catch(err => {
        toast({
          variant: "destructive",
          title: "Erro na autenticação",
          description: "Não foi possível entrar com Google. Verifique sua chave de API."
        });
      })
      .finally(() => setIsAuthProcessing(false));
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsAuthProcessing(true);

    try {
      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: "Conta criada!", description: "Bem-vindo ao Orçamento Inteligente." });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro na autenticação",
        description: err.message || "E-mail ou senha inválidos."
      });
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
      createdAt: serverTimestamp()
    }).catch(async (err) => {
      const permissionError = new FirestorePermissionError({
        path: colRef.path,
        operation: 'create',
        requestResourceData: data,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  const handleImport = (newTransactions: Transaction[]) => {
    if (!db || !user) return;
    const colRef = collection(db, 'users', user.uid, 'transactions');
    
    newTransactions.forEach(t => {
      addDoc(colRef, {
        ...t,
        userId: user.uid,
        createdAt: serverTimestamp()
      }).catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: t,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
    });
  };

  const handleUpdate = (id: string, updates: Partial<Transaction>) => {
    if (!db || !user) return;
    const docRef = doc(db, 'users', user.uid, 'transactions', id);
    
    updateDoc(docRef, updates).catch(async (err) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: updates,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  const handleDelete = (id: string) => {
    if (!db || !user) return;
    const docRef = doc(db, 'users', user.uid, 'transactions', id);
    
    deleteDoc(docRef).catch(async (err) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setTypeFilter('all');
    setSelectedMonth('all');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <Card className="max-w-md w-full shadow-xl border-none">
          <CardHeader className="text-center space-y-4">
            <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
              <LayoutDashboard className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold">Orçamento Inteligente</CardTitle>
              <CardDescription>Gerencie suas finanças com facilidade e IA.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="voce@exemplo.com" 
                    className="pl-9" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-9" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isAuthProcessing}>
                {isAuthProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                {authMode === 'login' ? 'Entrar' : 'Criar Conta'}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Ou continue com</span>
              </div>
            </div>

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
            <Button 
              variant="link" 
              className="w-full text-slate-500" 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
            >
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
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-primary hidden sm:block">
              Orçamento Inteligente
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <TransactionDialog onAdd={handleAdd} />
            <CSVImporter onImport={handleImport} />
            <div className="flex items-center gap-2 border-l pl-3 ml-1">
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-500 hover:text-rose-600 rounded-full h-8 w-8">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-slate-800 text-white overflow-x-auto no-scrollbar border-b">
        <div className="max-w-7xl mx-auto px-4 flex">
          <button
            onClick={() => setSelectedMonth('all')}
            className={cn(
              "px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 border-transparent hover:bg-slate-700",
              selectedMonth === 'all' && "border-primary bg-slate-700 text-primary-foreground"
            )}
          >
            Todos
          </button>
          {MONTHS.map((month, index) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(index)}
              className={cn(
                "px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 border-transparent hover:bg-slate-700",
                selectedMonth === index && "border-primary bg-slate-700 text-primary-foreground"
              )}
            >
              {month}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-8">
          <div className="flex items-center justify-between border-b pb-4">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Lançamentos
              </TabsTrigger>
              <TabsTrigger value="annual" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Resumo Anual
              </TabsTrigger>
            </TabsList>
            
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>
                {selectedMonth === 'all' ? 'Todo o período' : `Mês: ${MONTHS[selectedMonth as number]}`}
              </span>
            </div>
          </div>

          <TabsContent value="dashboard" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {dataLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
              </div>
            ) : (
              <>
                <DashboardSummary transactions={filteredTransactions} />

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
                    />
                    <TransactionTable 
                      transactions={filteredTransactions} 
                      onUpdate={handleUpdate} 
                      onDelete={handleDelete}
                    />
                  </div>

                  <aside className="space-y-8">
                    <section className="space-y-4">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <PieChart className="h-4 w-4 text-primary" />
                        Gastos por Categoria
                      </h2>
                      <FinanceChart transactions={filteredTransactions} />
                    </section>

                    <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
                      <h3 className="font-semibold text-primary mb-2">Histórico Ativo</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Todas as transações importadas estão salvas na nuvem. Você pode acessá-las de qualquer dispositivo fazendo login com sua conta.
                      </p>
                    </div>
                  </aside>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="annual" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <AnnualSummaryView transactions={transactions} />
          </TabsContent>
        </Tabs>
      </main>

      <Toaster />
      
      <footer className="bg-white border-t py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Orçamento Inteligente - Gestão Segura no Google Cloud
        </div>
      </footer>
    </div>
  );
}
