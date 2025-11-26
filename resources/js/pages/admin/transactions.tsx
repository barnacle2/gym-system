import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, DollarSign, ShoppingBag } from 'lucide-react';

interface UserOption {
    id: number;
    name: string;
    email: string;
}

interface Props {
    users: UserOption[];
}

export default function AdminTransactions({ users }: Props) {
    const [userId, setUserId] = useState(users[0]?.id?.toString() ?? '');
    const [product, setProduct] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !product || !amount) return;

        setProcessing(true);
        router.post(
            '/admin/transactions',
            {
                user_id: Number(userId),
                product,
                description,
                amount: parseFloat(amount),
            },
            {
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    setProduct('');
                    setDescription('');
                    setAmount('');
                },
            },
        );
    };

    const handleLogout = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/logout');
    };

    return (
        <>
            <Head title="Transactions" />
            <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-gray-200">
                <header className="sticky top-0 z-10 border-b border-gray-700 bg-slate-900/80 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <a
                                href="/dashboard"
                                className="cursor-pointer flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Dashboard
                            </a>
                            <h1 className="text-xl font-bold tracking-wide flex items-center gap-2">
                                <ShoppingBag className="h-5 w-5 text-emerald-400" />
                                Member Transactions
                            </h1>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="cursor-pointer px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 text-sm"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                <main className="mx-auto max-w-3xl p-5">
                    <section className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <DollarSign className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-200">Record Purchase / Charge</h2>
                                <p className="text-sm text-gray-400">
                                    Add a transaction for a member (e.g., protein shake, bottled water). This will increase their
                                    outstanding balance and appear in Balance Management.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Member</label>
                                    <select
                                        value={userId}
                                        onChange={(e) => setUserId(e.target.value)}
                                        className="w-full rounded-lg border border-gray-700 bg-slate-900/60 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        required
                                    >
                                        {users.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.name} ({u.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Product</label>
                                    <input
                                        type="text"
                                        value={product}
                                        onChange={(e) => setProduct(e.target.value)}
                                        placeholder="e.g., Protein shake, Bottled water"
                                        className="w-full rounded-lg border border-gray-700 bg-slate-900/60 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Description / notes</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Optional notes (e.g., paid later, promo, etc.)"
                                        className="w-full rounded-lg border border-gray-700 bg-slate-900/60 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Amount (₱)</label>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full rounded-lg border border-gray-700 bg-slate-900/60 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <a
                                    href="/dashboard"
                                    className="cursor-pointer px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 text-sm"
                                >
                                    Cancel
                                </a>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="cursor-pointer px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {processing ? 'Saving...' : 'Record Transaction'}
                                </button>
                            </div>
                        </form>
                    </section>
                </main>
            </div>
        </>
    );
}
