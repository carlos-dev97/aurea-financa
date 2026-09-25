(() => {
    'use strict';

    /* =========================================================
       AUREA FINANÇAS
       APP.JS — VERSÃO FINAL
       ========================================================= */

    const KEY = 'aurea_financas_v7';

    const LEGACY_KEYS = [
        'aurea_financas_v6',
        'aurea_financas_v5',
        'aurea_financas_v4'
    ];

    const money = new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR'
    });

    const $ = id => document.getElementById(id);

    const today = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    const uid = () =>
        `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

    const ym = date =>
        String(date || '').slice(0, 7);

    const sum = (arr, fn = x => x) =>
        (arr || []).reduce((total, item) => {
            return total + Number(fn(item) || 0);
        }, 0);

    const esc = value =>
        String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));

    const positiveNumber = value => {
        const number = Number(
            String(value ?? '')
                .replace(',', '.')
                .trim()
        );

        return Number.isFinite(number) && number > 0
            ? number
            : 0;
    };


    /* =========================================================
       CATEGORIAS
       ========================================================= */

    const CATEGORY_DATA = {
        'Alimentação': {
            className: 'food',
            icon: `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 3v8"/>
                    <path d="M4 3v5a3 3 0 0 0 6 0V3"/>
                    <path d="M7 11v10"/>
                    <path d="M17 3v18"/>
                    <path d="M17 3c3 2 3 7 0 9"/>
                </svg>
            `
        },

        'Carro': {
            className: 'car',
            icon: `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 17h14"/>
                    <path d="M6 17l1-7h10l1 7"/>
                    <path d="M8 10l1.2-3h5.6l1.2 3"/>
                    <circle cx="8" cy="17" r="1.5"/>
                    <circle cx="16" cy="17" r="1.5"/>
                </svg>
            `
        },

        'Lazer': {
            className: 'fun',
            icon: `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2"/>
                    <path d="m10 9 5 3-5 3z"/>
                </svg>
            `
        },

        'Compras': {
            className: 'shopping',
            icon: `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 8h12l-1 12H7z"/>
                    <path d="M9 8a3 3 0 0 1 6 0"/>
                </svg>
            `
        },

        'Contas': {
            className: 'bills',
            icon: `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="5" y="3" width="14" height="18" rx="2"/>
                    <path d="M8 7h8"/>
                    <path d="M8 11h8"/>
                    <path d="M8 15h5"/>
                </svg>
            `
        },

        'Saúde': {
            className: 'health',
            icon: `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 20S4 15 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 6-8 11-8 11z"/>
                    <path d="M12 7v6"/>
                    <path d="M9 10h6"/>
                </svg>
            `
        },

        'Outros': {
            className: 'other',
            icon: `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="8"/>
                    <path d="M8 12h8"/>
                    <path d="M12 8v8"/>
                </svg>
            `
        }
    };


    const CATEGORY_ALIASES = {
        'Combustível': 'Carro',
        'Combustivel': 'Carro'
    };


    function normalizeCategory(category) {

        const value = String(category || '').trim();

        if (!value) {
            return 'Outros';
        }

        return CATEGORY_ALIASES[value] || value;
    }


    function categoryIcon(category, extraClass = '') {

        const normalized = normalizeCategory(category);

        const data =
            CATEGORY_DATA[normalized] ||
            CATEGORY_DATA['Outros'];

        return `
            <div class="category-icon ${data.className} ${extraClass}">
                ${data.icon}
            </div>
        `;
    }


    /* =========================================================
       ESTADO INICIAL
       ========================================================= */

    const defaults = {
        profile: {
            name: '',
            birthDate: ''
        },

        salary: 0,

        fundTarget: 1000,

        fund: [],

        debts: [],

        expenses: [],

        subscriptions: [],

        goals: [],

        theme: 'light',

        accent: 'gold'
    };


    /* =========================================================
       STORAGE
       ========================================================= */

    function cloneDefaults() {

        return JSON.parse(
            JSON.stringify(defaults)
        );
    }


    function load() {

        let saved = null;

        try {

            const keys = [
                KEY,
                ...LEGACY_KEYS
            ];

            for (const key of keys) {

                const raw = localStorage.getItem(key);

                if (!raw) {
                    continue;
                }

                try {

                    saved = JSON.parse(raw);

                    if (saved) {
                        break;
                    }

                } catch {
                    continue;
                }
            }

        } catch {
            saved = null;
        }


        const base = cloneDefaults();

        const state = {
            ...base,
            ...(saved || {}),

            profile: {
                ...base.profile,
                ...(saved?.profile || {})
            },

            fund: Array.isArray(saved?.fund)
                ? saved.fund
                : [],

            debts: Array.isArray(saved?.debts)
                ? saved.debts
                : [],

            expenses: Array.isArray(saved?.expenses)
                ? saved.expenses
                : [],

            subscriptions: Array.isArray(saved?.subscriptions)
                ? saved.subscriptions
                : [],

            goals: Array.isArray(saved?.goals)
                ? saved.goals
                : []
        };


        state.expenses = state.expenses.map(expense => ({
            ...expense,

            id: expense.id || uid(),

            amount: Number(expense.amount || 0),

            category: normalizeCategory(
                expense.category
            ),

            description: String(
                expense.description || ''
            ),

            date: expense.date || today()
        }));


        state.debts = state.debts.map(debt => ({
            ...debt,

            id: debt.id || uid(),

            name: String(
                debt.name || 'Dívida'
            ),

            total: Number(
                debt.total || 0
            ),

            monthly: Number(
                debt.monthly || 0
            ),

            payments: Array.isArray(debt.payments)
                ? debt.payments.map(payment => ({
                    ...payment,
                    id: payment.id || uid(),
                    amount: Number(payment.amount || 0),
                    date: payment.date || today()
                }))
                : []
        }));


        state.fund = state.fund.map(item => ({
            ...item,

            id: item.id || uid(),

            amount: Number(
                item.amount || 0
            ),

            date: item.date || today(),

            type: item.type === 'remove'
                ? 'remove'
                : 'add'
        }));


        state.goals = state.goals.map(goal => ({
            ...goal,

            id: goal.id || uid(),

            name: String(
                goal.name || 'Objetivo'
            ),

            target: Number(
                goal.target || 0
            ),

            saved: Number(
                goal.saved || 0
            ),

            note: String(
                goal.note || ''
            ),

            contributions: Array.isArray(goal.contributions)
                ? goal.contributions
                : []
        }));


        state.subscriptions = state.subscriptions.map(item => ({
            ...item,

            id: item.id || uid(),

            name: String(
                item.name || 'Subscrição'
            ),

            amount: Number(
                item.amount || 0
            ),

            date: item.date || today()
        }));


        state.salary = Number(
            state.salary || 0
        );

        state.fundTarget = Number(
            state.fundTarget || 1000
        );


        return state;
    }


    let state = load();

    let currentMonth = ym(today());


    function save() {

        try {

            localStorage.setItem(
                KEY,
                JSON.stringify(state)
            );

        } catch (error) {

            console.error(
                'Aurea: erro ao guardar dados',
                error
            );
        }
    }


    save();


    /* =========================================================
       UTILITÁRIOS DE UI
       ========================================================= */

    function setText(id, value) {

        const element = $(id);

        if (element) {
            element.textContent = value;
        }
    }


    function open(id) {

        const element = $(id);

        if (element) {
            element.classList.remove('hidden');
        }
    }


    function close(id) {

        const element = $(id);

        if (element) {
            element.classList.add('hidden');
        }
    }


    function showToast(message) {

        let toast = $('toast');


        if (!toast) {

            toast = document.createElement('div');

            toast.id = 'toast';

            toast.className = 'toast';

            document.body.appendChild(toast);
        }


        toast.textContent = message;

        toast.classList.add('show');


        clearTimeout(
            toast._timer
        );


        toast._timer = setTimeout(() => {

            toast.classList.remove('show');

        }, 2400);
    }


    /* =========================================================
       CÁLCULOS
       ========================================================= */

    function fundBalance() {

        return sum(
            state.fund,
            item =>
                item.type === 'add'
                    ? item.amount
                    : -item.amount
        );
    }


    function fundBalanceWithout(id) {

        return sum(
            state.fund.filter(
                item => item.id !== id
            ),
            item =>
                item.type === 'add'
                    ? item.amount
                    : -item.amount
        );
    }


    function debtPaid(debt) {

        return sum(
            debt?.payments || [],
            payment => payment.amount
        );
    }


    function debtBalance(debt) {

        return Math.max(
            0,
            Number(debt?.total || 0) -
            debtPaid(debt)
        );
    }


    function monthExpenses(month = currentMonth) {

        return state.expenses.filter(
            expense =>
                ym(expense.date) === month
        );
    }


    function monthPayments(month = currentMonth) {

        return state.debts
            .flatMap(debt =>
                (debt.payments || []).map(
                    payment => ({
                        ...payment,
                        debtName: debt.name
                    })
                )
            )
            .filter(
                payment =>
                    ym(payment.date) === month
            );
    }


    function monthFund(month = currentMonth) {

        return state.fund.filter(
            item =>
                ym(item.date) === month
        );
    }


    function monthGoals(month = currentMonth) {

        return state.goals
            .flatMap(goal =>
                (goal.contributions || []).map(
                    contribution => ({
                        ...contribution,
                        goalName: goal.name
                    })
                )
            )
            .filter(
                item =>
                    ym(item.date) === month
            );
    }


    function available(month = currentMonth) {

        const salary = Number(
            state.salary || 0
        );

        const expenses = sum(
            monthExpenses(month),
            item => item.amount
        );

        const payments = sum(
            monthPayments(month),
            item => item.amount
        );

        const fundMovements = sum(
            monthFund(month),
            item =>
                item.type === 'add'
                    ? item.amount
                    : 0
        );

        const goals = sum(
            monthGoals(month),
            item => item.amount
        );


        return salary
            - expenses
            - payments
            - fundMovements
            - goals;
    }


    /* =========================================================
       MARGEM DE SEGURANÇA
       ========================================================= */

    function spendingRule() {

        const now = new Date();

        const day = now.getDate();

        const daysInMonth =
            new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                0
            ).getDate();

        const daysRemaining =
            Math.max(
                0,
                daysInMonth - day
            );


        let rate = 0.75;

        if (day <= 10) {
            rate = 0.25;
        } else if (day <= 20) {
            rate = 0.50;
        }


        return {
            day,
            daysInMonth,
            daysRemaining,
            rate
        };
    }


    function spendingPlan() {

        const balance =
            available();


        const rule =
            spendingRule();


        const protectedAmount =
            Math.max(
                0,
                balance
            ) * rule.rate;


        const freeAmount =
            Math.max(
                0,
                balance - protectedAmount
            );


        return {
            balance,
            protectedAmount,
            freeAmount,
            maxSpend: freeAmount,
            ...rule
        };
    }


    function recommendationText() {

        const plan =
            spendingPlan();


        if (state.salary <= 0) {

            return (
                'Define o teu salário mensal ' +
                'nas Definições para a Aurea ' +
                'começar a calcular a tua margem.'
            );
        }


        if (plan.balance <= 0) {

            return (
                `Neste momento tens ${money.format(
                    plan.balance
                )} disponíveis. Os movimentos registados ` +
                'já atingiram ou ultrapassaram o salário definido.'
            );
        }


        return (
            `Hoje é dia ${plan.day} e faltam ` +
            `${plan.daysRemaining} ` +
            `${plan.daysRemaining === 1 ? 'dia' : 'dias'} ` +
            `para terminar o mês. A Aurea protege ` +
            `${Math.round(plan.rate * 100)}% do saldo disponível ` +
            `(${money.format(plan.protectedAmount)}) e deixa ` +
            `${money.format(plan.maxSpend)} como dinheiro livre.`
        );

        
    }

        /* =========================================================
       ANIVERSÁRIO
       ========================================================= */

    function renderBirthdayMessage() {

        const container =
            $('birthdayMessage');


        if (!container) {
            return;
        }


        const birthDate =
            String(
                state.profile?.birthDate || ''
            ).trim();


        if (!birthDate) {

            container.innerHTML = '';

            return;
        }


        const todayDate =
            new Date();


        const birth =
            new Date(
                `${birthDate}T12:00:00`
            );


        const isBirthday =
            todayDate.getMonth() ===
                birth.getMonth() &&
            todayDate.getDate() ===
                birth.getDate();


        if (!isBirthday) {

            container.innerHTML = '';

            return;
        }


        const name =
            String(
                state.profile?.name || ''
            ).trim();


        container.innerHTML = `

            <div class="birthday-card">

                <div
                    class="birthday-icon"
                    aria-hidden="true"
                >
                    🎂
                </div>


                <div class="birthday-content">

                    <span class="eyebrow">
                        Um dia especial
                    </span>


                    <h2>
                        Feliz aniversário${
                            name
                                ? `, ${esc(name)}`
                                : ''
                        }! 🎉
                    </h2>


                    <p>
                        Que este novo ano te traga
                        grandes conquistas,
                        dentro e fora das tuas finanças. 🥂
                    </p>

                </div>

            </div>

        `;
    }



    /* =========================================================
       RENDER PRINCIPAL
       ========================================================= */

    function render() {

        document.body.dataset.theme =
            state.theme || 'light';

        document.body.dataset.accent =
            state.accent || 'gold';


        renderHome();

        renderDebts();

        renderExpenses();

        renderFund();

        renderGoals();

        renderSubscriptions();

        renderHistory();

        renderStats();

        renderSettings();

        renderThemeButtons();
        
        renderBirthdayMessage();
    }


    /* =========================================================
       INÍCIO
       ========================================================= */

    function renderHome() {

        const now =
            new Date();


        const greeting =
            now.getHours() < 12
                ? 'Bom dia'
                : now.getHours() < 18
                    ? 'Boa tarde'
                    : 'Boa noite';


        const name =
            String(
                state.profile.name || ''
            ).trim();


        const dateText =
            new Intl.DateTimeFormat(
                'pt-PT',
                {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                }
            )
                .format(now)
                .replace(
                    /^./,
                    letter =>
                        letter.toUpperCase()
                );


        setText(
            'todayText',
            dateText
        );


        setText(
            'greeting',
            name
                ? `${greeting}, ${name}`
                : greeting
        );


        const balance =
            available();


        setText(
            'availableBalance',
            money.format(balance)
        );


        setText(
            'balanceDescription',
            state.salary <= 0
                ? 'Define o teu salário para começar a calcular.'
                : balance >= 0
                    ? 'Saldo disponível depois dos movimentos registados.'
                    : 'Os movimentos registados ultrapassam o salário definido.'
        );


        setText(
            'metricSalary',
            money.format(state.salary)
        );


        setText(
            'metricExpenses',
            money.format(
                sum(
                    monthExpenses(),
                    item => item.amount
                )
            )
        );


        setText(
            'metricDebtPayments',
            money.format(
                sum(
                    monthPayments(),
                    item => item.amount
                )
            )
        );


        setText(
            'metricFund',
            money.format(
                fundBalance()
            )
        );


        const fund =
            fundBalance();


        const target =
            Number(
                state.fundTarget || 1000
            );


        const percentage =
            target > 0
                ? Math.min(
                    100,
                    Math.max(
                        0,
                        fund / target * 100
                    )
                )
                : 0;


        setText(
            'homeFundValue',
            money.format(fund)
        );


        setText(
            'homeFundPercent',
            `${Math.round(percentage)}%`
        );


        setText(
            'homeFundTarget',
            `Meta: ${money.format(target)}`
        );


        if ($('homeFundProgress')) {

            $('homeFundProgress').style.width =
                `${percentage}%`;
        }


        renderAdvisor();

        renderRecent();

        renderHomeDebts();
    }


    function renderAdvisor() {

        const element =
            $('advisorMessage');


        if (!element) {
            return;
        }


        if (state.salary <= 0) {

            element.innerHTML = `
                <strong>Recomendação da Aurea</strong>

                <p>
                    Define o teu salário mensal nas Definições.
                    Depois a Aurea calcula automaticamente
                    o saldo, a margem protegida e o dinheiro livre.
                </p>
            `;

            return;
        }


        const plan =
            spendingPlan();


        const percentage =
            Math.round(
                plan.rate * 100
            );


        const width =
            plan.balance > 0
                ? Math.min(
                    100,
                    plan.maxSpend /
                    plan.balance *
                    100
                )
                : 0;


        const days =
            Math.max(
                1,
                plan.daysRemaining
            );


        const daily =
            plan.maxSpend / days;


        element.innerHTML = `
            <div class="safety-head">
                <span>Margem de gasto</span>
                <strong>
                    ${money.format(plan.maxSpend)}
                </strong>
            </div>

            <div class="safety-track">
                <div
                    class="safety-fill good"
                    style="width:${width}%"
                ></div>
            </div>

            <div class="safety-scale">
                <span>
                    Saldo:
                    ${money.format(plan.balance)}
                </span>

                <span>
                    Protegido:
                    ${money.format(plan.protectedAmount)}
                </span>
            </div>

            <p>
                Hoje a Aurea protege
                <strong>${percentage}%</strong>
                do saldo disponível.

                Faltam
                <strong>${plan.daysRemaining}</strong>
                ${plan.daysRemaining === 1 ? 'dia' : 'dias'}
                para terminar o mês.

                O dinheiro livre equivale a cerca de
                <strong>${money.format(daily)}/dia</strong>.
            </p>
        `;
    }


    /* =========================================================
       DÍVIDAS
       ========================================================= */

    function renderDebts() {

        const element =
            $('debtsList');


        if (!element) {
            return;
        }


        if (!state.debts.length) {

            element.innerHTML = `
                <div class="empty card">
                    <div class="empty-icon">◈</div>
                    <b>Ainda não tens dívidas.</b>
                    <span>
                        Adiciona a primeira para começares a acompanhar.
                    </span>
                </div>
            `;

            updateDebtMetrics();

            return;
        }


        element.innerHTML =
            state.debts.map(debt => {

                const total =
                    Number(debt.total || 0);

                const paid =
                    debtPaid(debt);

                const remaining =
                    debtBalance(debt);

                const percentage =
                    total > 0
                        ? Math.min(
                            100,
                            paid / total * 100
                        )
                        : 0;


                return `
                    <div class="card debt-card">

                        <div class="card-header">

                            <div class="entity-title">

                                <div class="entity-icon debt-icon-bg">
                                    ◈
                                </div>

                                <div>
                                    <span class="card-label">
                                        Dívida
                                    </span>

                                    <h2>
                                        ${esc(debt.name)}
                                    </h2>
                                </div>

                            </div>

                            <div class="row-actions">

                                <button
                                    type="button"
                                    data-action="edit-debt"
                                    data-id="${esc(debt.id)}"
                                    title="Editar"
                                >
                                    ✎
                                </button>

                                <button
                                    type="button"
                                    class="danger-text"
                                    data-action="delete-debt"
                                    data-id="${esc(debt.id)}"
                                    title="Eliminar"
                                >
                                    ⌫
                                </button>

                            </div>

                        </div>


                        <div class="debt-numbers">

                            <strong>
                                ${money.format(remaining)}
                            </strong>

                            <span>
                                de ${money.format(total)}
                            </span>

                        </div>


                        <div class="progress">

                            <div
                                class="progress-bar"
                                style="width:${percentage}%"
                            ></div>

                        </div>


                        <div class="progress-info">

                            <span>
                                ${Math.round(percentage)}% pago
                            </span>

                            <span>
                                ${money.format(debt.monthly || 0)}
                                /mês
                            </span>

                        </div>


                        <button
                            type="button"
                            class="primary-button full"
                            data-action="pay-debt"
                            data-id="${esc(debt.id)}"
                        >
                            Registar pagamento
                        </button>

                    </div>
                `;
            }).join('');


        updateDebtMetrics();
    }


    function updateDebtMetrics() {

        setText(
            'debtTotal',
            money.format(
                sum(
                    state.debts,
                    debt => debtBalance(debt)
                )
            )
        );


        setText(
            'debtMonthly',
            money.format(
                sum(
                    monthPayments(),
                    payment => payment.amount
                )
            )
        );


        setText(
            'debtCount',
            state.debts.length
        );
    }


    /* =========================================================
       DESPESAS
       ========================================================= */

    function renderExpenses() {

        const expenses =
            monthExpenses();


        const total =
            sum(
                expenses,
                item => item.amount
            );


        setText(
            'expenseMonthTotal',
            money.format(total)
        );


        setText(
            'expenseCount',
            expenses.length
        );


        setText(
            'expenseAverage',
            money.format(
                expenses.length
                    ? total / expenses.length
                    : 0
            )
        );


        const list =
            $('expensesList');


        if (list) {

            if (!expenses.length) {

                list.innerHTML = `
                    <div class="empty-small">
                        Ainda não existem despesas neste mês.
                    </div>
                `;

            } else {

                list.innerHTML =
                    [...expenses]
                        .sort(
                            (a, b) =>
                                b.date.localeCompare(a.date)
                        )
                        .map(expense => {

                            return `
                                <div class="movement">

                                    ${categoryIcon(
                                        expense.category
                                    )}

                                    <div class="movement-info">

                                        <b>
                                            ${esc(
                                                expense.description ||
                                                expense.category
                                            )}
                                        </b>

                                        <small>
                                            ${esc(
                                                normalizeCategory(
                                                    expense.category
                                                )
                                            )}
                                            ·
                                            ${esc(expense.date)}
                                        </small>

                                    </div>

                                    <strong class="out">
                                        -
                                        ${money.format(
                                            expense.amount
                                        )}
                                    </strong>

                                    <div class="row-actions">

                                        <button
                                            type="button"
                                            data-action="edit-expense"
                                            data-id="${esc(expense.id)}"
                                        >
                                            ✎
                                        </button>

                                        <button
                                            type="button"
                                            class="danger-text"
                                            data-action="delete-expense"
                                            data-id="${esc(expense.id)}"
                                        >
                                            ⌫
                                        </button>

                                    </div>

                                </div>
                            `;
                        })
                        .join('');
            }
        }


        renderCategories();
    }


    function renderCategories() {

        const element =
            $('categoryOverview');


        if (!element) {
            return;
        }


        const totals = {};


        monthExpenses().forEach(expense => {

            const category =
                normalizeCategory(
                    expense.category
                );


            totals[category] =
                (totals[category] || 0) +
                Number(expense.amount || 0);
        });


        const categories =
            Object.entries(totals)
                .sort(
                    (a, b) =>
                        b[1] - a[1]
                );


        if (!categories.length) {

            element.innerHTML = `
                <div class="empty-small">
                    Ainda não existem despesas neste mês.
                </div>
            `;

            return;
        }


        element.innerHTML =
            categories.map(([name, value]) => {

                return `
                    <div class="category-card card">

                        ${categoryIcon(
                            name
                        )}

                        <div>
                            <span>
                                ${esc(name)}
                            </span>

                            <strong>
                                ${money.format(value)}
                            </strong>
                        </div>

                    </div>
                `;

            }).join('');
    }


    /* =========================================================
       FUNDO
       ========================================================= */

    function renderFund() {

        const balance =
            fundBalance();


        const target =
            Number(
                state.fundTarget || 1000
            );


        const percentage =
            target > 0
                ? Math.min(
                    100,
                    Math.max(
                        0,
                        balance / target * 100
                    )
                )
                : 0;


        setText(
            'fundCurrent',
            money.format(balance)
        );


        setText(
            'fundTarget',
            money.format(target)
        );


        setText(
            'fundPercent',
            `${Math.round(percentage)}%`
        );


        if ($('fundProgress')) {

            $('fundProgress').style.width =
                `${percentage}%`;
        }


        const list =
            $('fundHistory');


        if (!list) {
            return;
        }


        if (!state.fund.length) {

            list.innerHTML = `
                <div class="empty-small">
                    Ainda não tens movimentos no fundo.
                </div>
            `;

            return;
        }


        list.innerHTML =
            [...state.fund]
                .sort(
                    (a, b) =>
                        b.date.localeCompare(a.date)
                )
                .map(item => {

                    const adding =
                        item.type === 'add';


                    return `
                        <div class="movement">

                            <div class="movement-icon fund-movement">
                                €
                            </div>

                            <div class="movement-info">

                                <b>
                                    ${
                                        adding
                                            ? 'Entrada no fundo'
                                            : 'Levantamento do fundo'
                                    }
                                </b>

                                <small>
                                    ${esc(item.date)}
                                </small>

                            </div>

                            <strong
                                class="${
                                    adding
                                        ? 'out'
                                        : 'in'
                                }"
                            >
                                ${
                                    adding
                                        ? '-'
                                        : '+'
                                }
                                ${money.format(item.amount)}
                            </strong>

                            <div class="row-actions">

                                <button
                                    type="button"
                                    data-action="edit-fund"
                                    data-id="${esc(item.id)}"
                                >
                                    ✎
                                </button>

                                <button
                                    type="button"
                                    class="danger-text"
                                    data-action="delete-fund"
                                    data-id="${esc(item.id)}"
                                >
                                    ⌫
                                </button>

                            </div>

                        </div>
                    `;

                })
                .join('');
    }


    /* =========================================================
       OBJETIVOS
       ========================================================= */

    function renderGoals() {

        const element =
            $('goalsList');


        if (!element) {
            return;
        }


        if (!state.goals.length) {

            element.innerHTML = `
                <div class="empty card">

                    <b>
                        Ainda não tens objetivos.
                    </b>

                    <span>
                        Cria um objetivo para começares
                        a juntar dinheiro.
                    </span>

                </div>
            `;

            return;
        }


        element.innerHTML =
            state.goals.map(goal => {

                const saved =
                    Number(goal.saved || 0);

                const target =
                    Number(goal.target || 0);

                const percentage =
                    target > 0
                        ? Math.min(
                            100,
                            saved / target * 100
                        )
                        : 0;


                return `
                    <div class="card goal-card">

                        <div class="card-header">

                            <div class="entity-title">

                                <div class="entity-icon goal-icon-bg">
                                    ★
                                </div>

                                <div>

                                    <span class="card-label">
                                        Objetivo
                                    </span>

                                    <h2>
                                        ${esc(goal.name)}
                                    </h2>

                                </div>

                            </div>


                            <div class="row-actions">

                                <button
                                    type="button"
                                    data-action="edit-goal"
                                    data-id="${esc(goal.id)}"
                                >
                                    ✎
                                </button>

                                <button
                                    type="button"
                                    class="danger-text"
                                    data-action="delete-goal"
                                    data-id="${esc(goal.id)}"
                                >
                                    ⌫
                                </button>

                            </div>

                        </div>


                        ${
                            goal.note
                                ? `
                                    <p class="muted">
                                        ${esc(goal.note)}
                                    </p>
                                `
                                : ''
                        }


                        <div class="debt-numbers">

                            <strong>
                                ${money.format(saved)}
                            </strong>

                            <span>
                                de ${money.format(target)}
                            </span>

                        </div>


                        <div class="progress">

                            <div
                                class="progress-bar"
                                style="width:${percentage}%"
                            ></div>

                        </div>


                        <div class="progress-info">

                            <span>
                                ${Math.round(percentage)}%
                            </span>

                            <button
                                type="button"
                                class="primary-button small"
                                data-action="goal-add"
                                data-id="${esc(goal.id)}"
                            >
                                + Adicionar dinheiro
                            </button>

                        </div>

                    </div>
                `;

            }).join('');
    }


    /* =========================================================
       SUBSCRIÇÕES
       ========================================================= */

    function renderSubscriptions() {

        const element =
            $('subscriptionsList');


        if (!element) {
            return;
        }


        setText(
            'subscriptionsMonthlyTotal',
            money.format(
                sum(
                    state.subscriptions,
                    item => item.amount
                )
            )
        );


        if (!state.subscriptions.length) {

            element.innerHTML = `
                <div class="empty-small">
                    Nenhuma subscrição registada.
                </div>
            `;

            return;
        }


        element.innerHTML =
            state.subscriptions.map(item => {

                return `
                    <div class="subscription-row">

                        <div class="entity-title">

                            <div class="entity-icon subscription-icon-bg">
                                ↻
                            </div>

                            <div>

                                <b>
                                    ${esc(item.name)}
                                </b>

                                <small>
                                    ${money.format(item.amount)}
                                    /mês
                                    · cobrança
                                    ${esc(item.date || '—')}
                                </small>

                            </div>

                        </div>


                        <div class="row-actions">

                            <button
                                type="button"
                                data-action="edit-subscription"
                                data-id="${esc(item.id)}"
                            >
                                ✎
                            </button>

                            <button
                                type="button"
                                class="danger-text"
                                data-action="delete-subscription"
                                data-id="${esc(item.id)}"
                            >
                                ⌫
                            </button>

                        </div>

                    </div>
                `;

            }).join('');
    }


    /* =========================================================
       HISTÓRICO
       ========================================================= */

    function renderHistory() {

        const date =
            new Date(
                `${currentMonth}-01T12:00:00`
            );


        const label =
            new Intl.DateTimeFormat(
                'pt-PT',
                {
                    month: 'long',
                    year: 'numeric'
                }
            )
                .format(date)
                .replace(
                    /^./,
                    letter =>
                        letter.toUpperCase()
                );


        setText(
            'historyMonthLabel',
            label
        );


        const expenses =
            monthExpenses();


        const payments =
            monthPayments();


        const fund =
            monthFund();


        const goals =
            monthGoals();


        const out =
            sum(
                expenses,
                item => item.amount
            )
            +
            sum(
                payments,
                item => item.amount
            )
            +
            sum(
                fund,
                item =>
                    item.type === 'add'
                        ? item.amount
                        : 0
            )
            +
            sum(
                goals,
                item => item.amount
            );


        setText(
            'historyIncome',
            money.format(state.salary)
        );


        setText(
            'historyOut',
            money.format(out)
        );


        setText(
            'historyAvailable',
            money.format(
                available(currentMonth)
            )
        );


        const rows = [

            ...expenses.map(item => ({
                date: item.date,
                label:
                    item.description ||
                    normalizeCategory(item.category),
                amount:
                    -Number(item.amount)
            })),

            ...payments.map(item => ({
                date: item.date,
                label:
                    `Pagamento · ${item.debtName}`,
                amount:
                    -Number(item.amount)
            })),

            ...fund.map(item => ({
                date: item.date,
                label:
                    item.type === 'add'
                        ? 'Fundo · reforço'
                        : 'Fundo · levantamento',
                amount:
                    item.type === 'add'
                        ? -Number(item.amount)
                        : Number(item.amount)
            })),

            ...goals.map(item => ({
                date: item.date,
                label:
                    `Objetivo · ${item.goalName}`,
                amount:
                    -Number(item.amount)
            }))

        ].sort(
            (a, b) =>
                b.date.localeCompare(a.date)
        );


        const element =
            $('historyMovements');


        if (!element) {
            return;
        }


        if (!rows.length) {

            element.innerHTML = `
                <div class="empty-small">
                    Sem movimentos neste mês.
                </div>
            `;

            return;
        }


        element.innerHTML =
            rows.map(item => {

                return `
                    <div class="movement">

                        <div class="movement-info">

                            <b>
                                ${esc(item.label)}
                            </b>

                            <small>
                                ${esc(item.date)}
                            </small>

                        </div>

                        <strong
                            class="${
                                item.amount >= 0
                                    ? 'in'
                                    : 'out'
                            }"
                        >
                            ${
                                item.amount >= 0
                                    ? '+'
                                    : ''
                            }
                            ${money.format(item.amount)}
                        </strong>

                    </div>
                `;

            }).join('');
    }


    /* =========================================================
       ESTATÍSTICAS
       ========================================================= */

    function renderStats() {

        setText(
            'statsExpenses',
            money.format(
                sum(
                    monthExpenses(),
                    item => item.amount
                )
            )
        );


        setText(
            'statsDebt',
            money.format(
                sum(
                    monthPayments(),
                    item => item.amount
                )
            )
        );


        setText(
            'statsFund',
            money.format(
                fundBalance()
            )
        );


        const totals = {};


        monthExpenses().forEach(
            expense => {

                const category =
                    normalizeCategory(
                        expense.category
                    );


                totals[category] =
                    (totals[category] || 0) +
                    Number(expense.amount || 0);
            }
        );


        const total =
            sum(
                Object.values(totals)
            );


        const element =
            $('statsCategories');


        if (!element) {
            return;
        }


        if (!Object.keys(totals).length) {

            element.innerHTML = `
                <div class="empty-small">
                    Ainda não existem dados.
                </div>
            `;

            return;
        }


        element.innerHTML =
            Object.entries(totals)
                .sort(
                    (a, b) =>
                        b[1] - a[1]
                )
                .map(([name, value]) => {

                    const percentage =
                        total > 0
                            ? value / total * 100
                            : 0;


                    return `
                        <div class="stat-row">

                            ${categoryIcon(name)}

                            <span>
                                ${esc(name)}
                            </span>

                            <div class="progress">

                                <div
                                    class="progress-bar"
                                    style="width:${percentage}%"
                                ></div>

                            </div>

                            <b>
                                ${money.format(value)}
                            </b>

                        </div>
                    `;

                })
                .join('');
    }


    /* =========================================================
       DEFINIÇÕES
       ========================================================= */

    function renderSettings() {

        if ($('settingsName')) {
            $('settingsName').value =
                state.profile.name || '';
        }


        if ($('settingsBirthDate')) {
            $('settingsBirthDate').value =
                state.profile.birthDate || '';
        }


        if ($('settingsSalary')) {
            $('settingsSalary').value =
                state.salary || '';
        }


        if ($('settingsFundTarget')) {
            $('settingsFundTarget').value =
                state.fundTarget || 1000;
        }
    }


    function renderThemeButtons() {

        document
            .querySelectorAll(
                '[data-action="set-theme"]'
            )
            .forEach(button => {

                button.classList.toggle(
                    'selected',
                    button.dataset.themeValue ===
                    state.theme
                );
            });


        document
            .querySelectorAll(
                '[data-action="set-accent"]'
            )
            .forEach(button => {

                button.classList.toggle(
                    'selected',
                    button.dataset.accentValue ===
                    state.accent
                );
            });
    }


    /* =========================================================
       RECENTES
       ========================================================= */

    function renderRecent() {

        const element =
            $('recentExpenses');


        if (!element) {
            return;
        }


        const expenses =
            [...state.expenses]
                .sort(
                    (a, b) =>
                        b.date.localeCompare(a.date)
                )
                .slice(0, 5);


        if (!expenses.length) {

            element.innerHTML = `
                <div class="empty-small">
                    Ainda não tens despesas registadas.
                </div>
            `;

            return;
        }


        element.innerHTML =
            expenses.map(expense => {

                return `
                    <div class="movement">

                        ${categoryIcon(
                            expense.category
                        )}

                        <div class="movement-info">

                            <b>
                                ${esc(
                                    expense.description ||
                                    normalizeCategory(
                                        expense.category
                                    )
                                )}
                            </b>

                            <small>
                                ${esc(expense.date)}
                            </small>

                        </div>

                        <strong class="out">
                            -
                            ${money.format(
                                expense.amount
                            )}
                        </strong>

                    </div>
                `;

            }).join('');
    }


    function renderHomeDebts() {

        const element =
            $('homeDebts');


        if (!element) {
            return;
        }


        if (!state.debts.length) {

            element.innerHTML = `
                <div class="empty-small">
                    Ainda não tens dívidas registadas.
                </div>
            `;

            return;
        }


        element.innerHTML =
            state.debts
                .slice(0, 3)
                .map(debt => {

                    return `
                        <div class="mini-debt">

                            <div class="mini-debt-icon">
                                ◈
                            </div>

                            <span>
                                ${esc(debt.name)}
                            </span>

                            <b>
                                ${money.format(
                                    debtBalance(debt)
                                )}
                            </b>

                        </div>
                    `;

                })
                .join('');
    }


    /* =========================================================
   NAVEGAÇÃO
   ========================================================= */

function navigate(section) {

    /* =====================================================
       SECÇÃO PRINCIPAL
       ===================================================== */

    document
        .querySelectorAll('.app-section')
        .forEach(element => {

            element.classList.toggle(
                'active',
                element.id === `section-${section}`
            );

        });


    /* =====================================================
       NAVEGAÇÃO DESKTOP
       ===================================================== */

    document
        .querySelectorAll(
            '.sidebar [data-action="navigate"]'
        )
        .forEach(button => {

            button.classList.toggle(
                'active',
                button.dataset.section === section
            );

        });


    /* =====================================================
       NAVEGAÇÃO MOBILE PRINCIPAL
       ===================================================== */

    const mobilePrimarySections = [
        'home',
        'fund',
        'expenses'
    ];


    document
        .querySelectorAll(
            '.mobile-nav-item[data-section]'
        )
        .forEach(button => {

            const buttonSection =
                button.dataset.section;


            /*
             * Os botões principais só ficam ativos
             * quando correspondem diretamente à secção.
             */
            button.classList.toggle(
                'active',
                mobilePrimarySections.includes(
                    buttonSection
                ) &&
                buttonSection === section
            );

        });


    /* =====================================================
       SECÇÕES DENTRO DE "MAIS"
       ===================================================== */

    const moreSections = [
        'debts',
        'goals',
        'history',
        'subscriptions',
        'stats'
    ];


    const isMoreSection =
        moreSections.includes(section);


    const moreButton =
        document.querySelector(
            '.mobile-more-button'
        );


    const moreMenu =
        $('mobileMoreMenu');


    /* =====================================================
       BOTÃO "MAIS"
       ===================================================== */

    if (moreButton) {

        moreButton.classList.toggle(
            'active',
            isMoreSection
        );


        moreButton.setAttribute(
            'aria-expanded',
            'false'
        );

    }


    /* =====================================================
       ITENS DENTRO DO MENU "MAIS"
       ===================================================== */

    document
        .querySelectorAll(
            '.mobile-more-item[data-section]'
        )
        .forEach(button => {

            button.classList.toggle(
                'active',
                button.dataset.section === section
            );

        });


    /* =====================================================
       FECHAR MENU "MAIS"
       ===================================================== */

    if (moreMenu) {

        moreMenu.classList.remove(
            'open'
        );

    }


    /* =====================================================
       SCROLL PARA O TOPO
       ===================================================== */

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

}


    /* =========================================================
       MODAIS
       ========================================================= */

    function showModal(title, content) {

        const modal =
            $('dynamicModal');


        if (!modal) {

            console.error(
                'Aurea: dynamicModal não encontrado.'
            );

            return;
        }


        modal.innerHTML = `
            <div class="modal">

                <div class="modal-header">

                    <div>

                        <span class="eyebrow">
                            Aurea
                        </span>

                        <h2>
                            ${title}
                        </h2>

                    </div>

                    <button
                        type="button"
                        class="close-button"
                        data-action="close-dynamic"
                        aria-label="Fechar"
                    >
                        ×
                    </button>

                </div>

                ${content}

            </div>
        `;


        open('dynamicModal');


        const form =
            modal.querySelector(
                '#dynamicForm'
            );


        if (form) {

            form.addEventListener(
                'submit',
                handleDynamicFormSubmit
            );
        }


        const saveButton =
            form?.querySelector(
                '[data-save-form]'
            );


        if (saveButton) {

            saveButton.addEventListener(
                'click',
                event => {

                    event.preventDefault();

                    if (
                        typeof form.requestSubmit ===
                        'function'
                    ) {

                        form.requestSubmit();

                    } else {

                        handleDynamicFormSubmit(
                            new Event('submit', {
                                bubbles: true,
                                cancelable: true
                            })
                        );
                    }
                }
            );
        }
    }


    const formActions = `
        <div class="form-actions">

            <button
                type="button"
                class="secondary-button"
                data-action="close-dynamic"
            >
                Cancelar
            </button>

            <button
                type="submit"
                class="primary-button"
                data-save-form
            >
                Guardar
            </button>

        </div>
    `;


    /* =========================================================
       SELETOR VISUAL DE CATEGORIAS
       ========================================================= */

    function categoryPicker(selected) {

        const current =
            normalizeCategory(
                selected || 'Outros'
            );


        return `
            <div class="category-picker">

                <input
                    type="hidden"
                    name="category"
                    id="expenseCategoryValue"
                    value="${esc(current)}"
                >

                <div class="category-picker-grid">

                    ${Object.keys(CATEGORY_DATA)
                        .map(category => {

                            const active =
                                category === current
                                    ? 'selected'
                                    : '';

                            return `
                                <button
                                    type="button"
                                    class="
                                        category-choice
                                        ${active}
                                    "
                                    data-category-choice="${esc(category)}"
                                >

                                    ${categoryIcon(
                                        category
                                    )}

                                    <span>
                                        ${esc(category)}
                                    </span>

                                </button>
                            `;

                        })
                        .join('')}

                </div>

            </div>
        `;
    }


    /* =========================================================
       FORMULÁRIOS
       ========================================================= */

    function dynamicForm(
        kind,
        item = {}
    ) {

        if (kind === 'expense') {

            const category =
                normalizeCategory(
                    item.category ||
                    'Alimentação'
                );


            return `
                <form
                    id="dynamicForm"
                    novalidate
                >

                    <input
                        type="hidden"
                        name="kind"
                        value="expense"
                    >

                    <input
                        type="hidden"
                        name="id"
                        value="${esc(item.id || '')}"
                    >

                    <label>
                        Valor

                        <input
                            name="amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            inputmode="decimal"
                            value="${item.amount || ''}"
                            placeholder="0,00"
                            required
                            autocomplete="off"
                        >
                    </label>

                    <label>
                        Categoria
                    </label>

                    ${categoryPicker(category)}

                    <label>
                        Descrição

                        <input
                            name="description"
                            type="text"
                            value="${esc(
                                item.description || ''
                            )}"
                            placeholder="Ex.: supermercado"
                            autocomplete="off"
                        >
                    </label>

                    <label>
                        Data

                        <input
                            name="date"
                            type="date"
                            value="${item.date || today()}"
                            required
                        >
                    </label>

                    ${formActions}

                </form>
            `;
        }


        if (kind === 'debt') {

            return `
                <form
                    id="dynamicForm"
                    novalidate
                >

                    <input
                        type="hidden"
                        name="kind"
                        value="debt"
                    >

                    <input
                        type="hidden"
                        name="id"
                        value="${esc(item.id || '')}"
                    >

                    <label>
                        Nome

                        <input
                            name="name"
                            type="text"
                            value="${esc(item.name || '')}"
                            placeholder="Ex.: Crédito pessoal"
                            required
                        >
                    </label>

                    <label>
                        Valor total

                        <input
                            name="total"
                            type="number"
                            min="0.01"
                            step="0.01"
                            inputmode="decimal"
                            value="${item.total || ''}"
                            placeholder="0,00"
                            required
                        >
                    </label>

                    <label>
                        Pagamento mensal

                        <input
                            name="monthly"
                            type="number"
                            min="0"
                            step="0.01"
                            inputmode="decimal"
                            value="${item.monthly || ''}"
                            placeholder="0,00"
                        >
                    </label>

                    ${formActions}

                </form>
            `;
        }


        if (kind === 'payment') {

            const remaining =
                debtBalance(item);


            const suggested =
                Math.min(
                    Number(item.monthly || 0),
                    remaining
                );


            return `
                <form
                    id="dynamicForm"
                    novalidate
                >

                    <input
                        type="hidden"
                        name="kind"
                        value="payment"
                    >

                    <input
                        type="hidden"
                        name="debtId"
                        value="${esc(item.id)}"
                    >

                    <p class="muted">
                        Em dívida:
                        <strong>
                            ${money.format(remaining)}
                        </strong>
                    </p>

                    <label>
                        Valor do pagamento

                        <input
                            name="amount"
                            type="number"
                            min="0.01"
                            max="${remaining}"
                            step="0.01"
                            inputmode="decimal"
                            value="${suggested || ''}"
                            required
                        >
                    </label>

                    <label>
                        Data

                        <input
                            name="date"
                            type="date"
                            value="${today()}"
                            required
                        >
                    </label>

                    ${formActions}

                </form>
            `;
        }


        if (kind === 'fund') {

            return `
                <form
                    id="dynamicForm"
                    novalidate
                >

                    <input
                        type="hidden"
                        name="kind"
                        value="fund"
                    >

                    <input
                        type="hidden"
                        name="id"
                        value="${esc(item.id || '')}"
                    >

                    <label>
                        Tipo

                        <select name="type">

                            <option
                                value="add"
                                ${item.type !== 'remove'
                                    ? 'selected'
                                    : ''}
                            >
                                Adicionar ao fundo
                            </option>

                            <option
                                value="remove"
                                ${item.type === 'remove'
                                    ? 'selected'
                                    : ''}
                            >
                                Levantar do fundo
                            </option>

                        </select>

                    </label>

                    <label>
                        Valor

                        <input
                            name="amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            inputmode="decimal"
                            value="${item.amount || ''}"
                            placeholder="0,00"
                            required
                        >
                    </label>

                    <label>
                        Data

                        <input
                            name="date"
                            type="date"
                            value="${item.date || today()}"
                            required
                        >
                    </label>

                    ${formActions}

                </form>
            `;
        }


        if (kind === 'goal') {

            return `
                <form
                    id="dynamicForm"
                    novalidate
                >

                    <input
                        type="hidden"
                        name="kind"
                        value="goal"
                    >

                    <input
                        type="hidden"
                        name="id"
                        value="${esc(item.id || '')}"
                    >

                    <label>
                        Nome do objetivo

                        <input
                            name="name"
                            type="text"
                            value="${esc(item.name || '')}"
                            placeholder="Ex.: Viagem"
                            required
                        >
                    </label>

                    <label>
                        Meta

                        <input
                            name="target"
                            type="number"
                            min="1"
                            step="0.01"
                            inputmode="decimal"
                            value="${item.target || ''}"
                            placeholder="1000"
                            required
                        >
                    </label>

                    <label>
                        Já poupado

                        <input
                            name="saved"
                            type="number"
                            min="0"
                            step="0.01"
                            inputmode="decimal"
                            value="${item.saved || 0}"
                        >
                    </label>

                    <label>
                        Nota

                        <input
                            name="note"
                            type="text"
                            value="${esc(item.note || '')}"
                            placeholder="Ex.: Férias"
                        >
                    </label>

                    ${formActions}

                </form>
            `;
        }


        if (kind === 'goaladd') {

            return `
                <form
                    id="dynamicForm"
                    novalidate
                >

                    <input
                        type="hidden"
                        name="kind"
                        value="goaladd"
                    >

                    <input
                        type="hidden"
                        name="id"
                        value="${esc(item.id)}"
                    >

                    <label>
                        Quanto queres adicionar?

                        <input
                            name="amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            inputmode="decimal"
                            placeholder="0,00"
                            required
                        >
                    </label>

                    <label>
                        Data

                        <input
                            name="date"
                            type="date"
                            value="${today()}"
                            required
                        >
                    </label>

                    <p class="form-note">
                        Este valor é considerado dinheiro poupado
                        e reduz o saldo disponível deste mês.
                    </p>

                    ${formActions}

                </form>
            `;
        }


        return `
            <form
                id="dynamicForm"
                novalidate
            >

                <input
                    type="hidden"
                    name="kind"
                    value="subscription"
                >

                <input
                    type="hidden"
                    name="id"
                    value="${esc(item.id || '')}"
                >

                <label>
                    Nome

                    <input
                        name="name"
                        type="text"
                        value="${esc(item.name || '')}"
                        placeholder="Ex.: Spotify"
                        required
                    >
                </label>

                <label>
                    Valor mensal

                    <input
                        name="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        inputmode="decimal"
                        value="${item.amount || ''}"
                        placeholder="0,00"
                        required
                    >
                </label>

                <label>
                    Próxima cobrança

                    <input
                        name="date"
                        type="date"
                        value="${item.date || today()}"
                        required
                    >
                </label>

                ${formActions}

            </form>
        `;
    }


    /* =========================================================
       GRAVAÇÃO DO FORMULÁRIO DINÂMICO
       ========================================================= */

    function handleDynamicFormSubmit(event) {

        event.preventDefault();

        event.stopPropagation();


        const form =
            event.currentTarget ||
            event.target;


        if (!form) {
            return;
        }


        const formData =
            new FormData(form);


        const data =
            Object.fromEntries(
                formData.entries()
            );


        const kind =
            String(
                data.kind || ''
            );


        if (kind === 'expense') {

            const amount =
                positiveNumber(
                    data.amount
                );


            const category =
                normalizeCategory(
                    data.category
                );


            const description =
                String(
                    data.description || ''
                ).trim();


            const date =
                String(
                    data.date || ''
                ).trim();


            if (!amount) {

                showToast(
                    'Indica um valor válido.'
                );

                return;
            }


            if (!date) {

                showToast(
                    'Indica uma data.'
                );

                return;
            }


            const id =
                String(
                    data.id || ''
                );


            const existingIndex =
                state.expenses.findIndex(
                    expense =>
                        expense.id === id
                );


            const expense = {

                id:
                    id ||
                    uid(),

                amount,

                category,

                description,

                date

            };


            if (existingIndex >= 0) {

                state.expenses[
                    existingIndex
                ] = expense;

            } else {

                state.expenses.push(
                    expense
                );
            }


            save();

            close(
                'dynamicModal'
            );

            render();

            showToast(
                existingIndex >= 0
                    ? 'Despesa atualizada.'
                    : 'Despesa guardada.'
            );

            return;
        }


        if (kind === 'debt') {

            const name =
                String(
                    data.name || ''
                ).trim();


            const total =
                positiveNumber(
                    data.total
                );


            const monthly =
                Math.max(
                    0,
                    Number(
                        String(
                            data.monthly || 0
                        ).replace(',', '.')
                    )
                );


            if (!name) {

                showToast(
                    'Indica o nome da dívida.'
                );

                return;
            }


            if (!total) {

                showToast(
                    'Indica o valor total da dívida.'
                );

                return;
            }


            const id =
                String(
                    data.id || ''
                );


            const existing =
                state.debts.find(
                    debt =>
                        debt.id === id
                );


            const debt = {

                id:
                    id ||
                    uid(),

                name,

                total,

                monthly,

                payments:
                    existing?.payments ||
                    []

            };


            const index =
                state.debts.findIndex(
                    item =>
                        item.id === debt.id
                );


            if (index >= 0) {

                state.debts[index] =
                    debt;

            } else {

                state.debts.push(
                    debt
                );
            }


            save();

            close(
                'dynamicModal'
            );

            render();

            showToast(
                index >= 0
                    ? 'Dívida atualizada.'
                    : 'Dívida guardada.'
            );

            return;
        }


        if (kind === 'payment') {

            const debt =
                state.debts.find(
                    item =>
                        item.id ===
                        data.debtId
                );


            if (!debt) {

                showToast(
                    'Dívida não encontrada.'
                );

                return;
            }


            const amount =
                positiveNumber(
                    data.amount
                );


            const remaining =
                debtBalance(
                    debt
                );


            if (!amount) {

                showToast(
                    'Indica um valor válido.'
                );

                return;
            }


            if (amount > remaining) {

                showToast(
                    'O pagamento não pode ser superior ao valor em dívida.'
                );

                return;
            }


            debt.payments =
                Array.isArray(
                    debt.payments
                )
                    ? debt.payments
                    : [];


            debt.payments.push({

                id: uid(),

                amount,

                date:
                    data.date ||
                    today()

            });


            save();

            close(
                'dynamicModal'
            );

            render();

            showToast(
                'Pagamento registado.'
            );

            return;
        }


        if (kind === 'fund') {

            const amount =
                positiveNumber(
                    data.amount
                );


            const type =
                data.type === 'remove'
                    ? 'remove'
                    : 'add';


            const date =
                data.date ||
                today();


            if (!amount) {

                showToast(
                    'Indica um valor válido.'
                );

                return;
            }


            const id =
                String(
                    data.id || ''
                );


            let availableFund;


            if (id) {

                availableFund =
                    fundBalanceWithout(id);

            } else {

                availableFund =
                    fundBalance();
            }


            if (
                type === 'remove' &&
                amount > availableFund
            ) {

                showToast(
                    'Não podes levantar mais dinheiro do que tens no fundo.'
                );

                return;
            }


            const movement = {

                id:
                    id ||
                    uid(),

                type,

                amount,

                date

            };


            const index =
                state.fund.findIndex(
                    item =>
                        item.id ===
                        movement.id
                );


            if (index >= 0) {

                state.fund[index] =
                    movement;

            } else {

                state.fund.push(
                    movement
                );
            }


            save();

            close(
                'dynamicModal'
            );

            render();

            showToast(
                'Movimento do fundo guardado.'
            );

            return;
        }


        if (kind === 'goal') {

            const name =
                String(
                    data.name || ''
                ).trim();


            const target =
                positiveNumber(
                    data.target
                );


            const saved =
                Math.max(
                    0,
                    Number(
                        String(
                            data.saved || 0
                        ).replace(',', '.')
                    )
                );


            if (!name) {

                showToast(
                    'Indica o nome do objetivo.'
                );

                return;
            }


            if (!target) {

                showToast(
                    'Indica o valor da meta.'
                );

                return;
            }


            const id =
                String(
                    data.id || ''
                );


            const existing =
                state.goals.find(
                    goal =>
                        goal.id === id
                );


            const goal = {

                id:
                    id ||
                    uid(),

                name,

                target,

                saved,

                note:
                    String(
                        data.note || ''
                    ).trim(),

                contributions:
                    existing?.contributions ||
                    []

            };


            const index =
                state.goals.findIndex(
                    item =>
                        item.id ===
                        goal.id
                );


            if (index >= 0) {

                state.goals[index] =
                    goal;

            } else {

                state.goals.push(
                    goal
                );
            }


            save();

            close(
                'dynamicModal'
            );

            render();

            showToast(
                'Objetivo guardado.'
            );

            return;
        }


        if (kind === 'goaladd') {

            const goal =
                state.goals.find(
                    item =>
                        item.id ===
                        data.id
                );


            if (!goal) {

                showToast(
                    'Objetivo não encontrado.'
                );

                return;
            }


            const amount =
                positiveNumber(
                    data.amount
                );


            if (!amount) {

                showToast(
                    'Indica um valor válido.'
                );

                return;
            }


            goal.saved =
                Number(
                    goal.saved || 0
                ) + amount;


            if (
                !Array.isArray(
                    goal.contributions
                )
            ) {

                goal.contributions = [];
            }


            goal.contributions.push({

                id: uid(),

                amount,

                date:
                    data.date ||
                    today()

            });


            save();

            close(
                'dynamicModal'
            );

            render();

            showToast(
                'Dinheiro adicionado ao objetivo.'
            );

            return;
        }


        if (kind === 'subscription') {

            const name =
                String(
                    data.name || ''
                ).trim();


            const amount =
                positiveNumber(
                    data.amount
                );


            const date =
                data.date ||
                today();


            if (!name) {

                showToast(
                    'Indica o nome da subscrição.'
                );

                return;
            }


            if (!amount) {

                showToast(
                    'Indica o valor da subscrição.'
                );

                return;
            }


            const id =
                String(
                    data.id || ''
                );


            const subscription = {

                id:
                    id ||
                    uid(),

                name,

                amount,

                date

            };


            const index =
                state.subscriptions.findIndex(
                    item =>
                        item.id ===
                        subscription.id
                );


            if (index >= 0) {

                state.subscriptions[index] =
                    subscription;

            } else {

                state.subscriptions.push(
                    subscription
                );
            }


            save();

            close(
                'dynamicModal'
            );

            render();

            showToast(
                'Subscrição guardada.'
            );

            return;
        }


        showToast(
            'Não foi possível identificar o formulário.'
        );
    }


    /* =========================================================
       CHAT
       ========================================================= */

    function parseMoney(text) {

        let value =
            String(
                text || ''
            )
                .replace(/\s/g, '')
                .replace(/€/g, '');


        const match =
            value.match(
                /(?:\d{1,3}(?:\.\d{3})+|\d+)(?:[.,]\d{1,2})?/
            );


        if (!match) {
            return null;
        }


        let number =
            match[0];


        if (
            number.includes('.') &&
            number.includes(',')
        ) {

            number =
                number
                    .replace(/\./g, '')
                    .replace(',', '.');

        } else if (
            number.includes(',')
        ) {

            number =
                number.replace(',', '.');

        } else if (
            /^\d{1,3}(?:\.\d{3})+$/.test(
                number
            )
        ) {

            number =
                number.replace(/\./g, '');
        }


        const result =
            Number(number);


        return Number.isFinite(result)
            ? result
            : null;
    }


    function answerQuestion(question) {

        const text =
            String(
                question || ''
            )
                .toLowerCase()
                .trim();


        const plan =
            spendingPlan();


        if (state.salary <= 0) {

            return (
                'Primeiro define o teu salário mensal ' +
                'em Definições. Depois a Aurea consegue ' +
                'calcular a tua margem corretamente.'
            );
        }


        const amount =
            parseMoney(question);


        if (
            text.includes('posso gastar') &&
            amount !== null
        ) {

            const free =
                Math.max(
                    0,
                    plan.freeAmount
                );


            const days =
                Math.max(
                    1,
                    plan.daysRemaining
                );


            const after =
                free - amount;


            const dailyAfter =
                Math.max(
                    0,
                    after
                ) / days;


            const share =
                free > 0
                    ? amount / free
                    : 1;


            if (amount > free) {

                return (
                    `Não cabe no dinheiro livre atual. ` +
                    `${money.format(amount)} ultrapassa ` +
                    `a margem livre em ` +
                    `${money.format(amount - free)}. ` +
                    `Tens ${money.format(free)} livres ` +
                    `e ${money.format(plan.protectedAmount)} protegidos.`
                );
            }


            if (share >= 0.75) {

                return (
                    `Cabe matematicamente na margem livre, ` +
                    `mas consome cerca de ${Math.round(
                        share * 100
                    )}% do teu dinheiro livre. ` +
                    `Depois ficarias com ${money.format(
                        after
                    )}, cerca de ${money.format(
                        dailyAfter
                    )}/dia para o resto do mês.`
                );
            }


            if (share >= 0.5) {

                return (
                    `Cabe dentro da margem livre, mas é um ` +
                    `gasto relevante. Depois ficarias com ` +
                    `${money.format(after)} para o resto do mês, ` +
                    `cerca de ${money.format(
                        dailyAfter
                    )}/dia.`
                );
            }


            return (
                `Sim, cabe na margem livre atual. ` +
                `Depois ficariam ${money.format(
                    after
                )} livres para o resto do mês.`
            );
        }


        if (
            text.includes('quanto posso gastar') ||
            text.includes('quanto posso')
        ) {

            const daily =
                plan.maxSpend /
                Math.max(
                    1,
                    plan.daysRemaining
                );


            return (
                `Tens ${money.format(
                    plan.balance
                )} disponíveis. A Aurea protege ` +
                `${money.format(
                    plan.protectedAmount
                )} e considera ` +
                `${money.format(
                    plan.maxSpend
                )} como dinheiro livre. ` +
                `Isto corresponde a cerca de ` +
                `${money.format(
                    daily
                )}/dia.`
            );
        }


        if (
            text.includes('reserva') ||
            text.includes('deixar')
        ) {

            return (
                `Neste momento a margem protegida é ` +
                `${money.format(
                    plan.protectedAmount
                )}, equivalente a ` +
                `${Math.round(
                    plan.rate * 100
                )}% do saldo disponível.`
            );
        }


        if (
            text.includes('recomend')
        ) {

            return recommendationText();
        }


        return (
            'Posso ajudar-te com perguntas como: ' +
            '“Quanto posso gastar?”, ' +
            '“Posso gastar 50€?” ou ' +
            '“Quanto devo deixar de reserva?”.'
        );
    }


    function addChatMessage(
        message,
        who = 'aurea'
    ) {

        const box =
            $('chatMessages');


        if (!box) {
            return;
        }


        const element =
            document.createElement('div');


        element.className =
            `chat-message ${who}`;


        element.textContent =
            message;


        box.appendChild(
            element
        );


        box.scrollTop =
            box.scrollHeight;
    }


    function openChat() {

        open('chatOverlay');


        const box =
            $('chatMessages');


        if (
            box &&
            !box.children.length
        ) {

            addChatMessage(
                'Olá. Posso ajudar-te a perceber quanto tens disponível, quanto tens livre e qual a margem protegida para hoje.'
            );
        }


        setTimeout(() => {

            $('chatInput')?.focus();

        }, 120);
    }


    /* =========================================================
       EXPORTAÇÃO
       ========================================================= */

    function exportPdf() {

        const report =
            $('printReport');


        if (!report) {
            return;
        }


        const rows = [

            ...monthExpenses().map(
                item => ({
                    date: item.date,
                    label:
                        item.description ||
                        normalizeCategory(
                            item.category
                        ),
                    amount:
                        -Number(item.amount)
                })
            ),

            ...monthPayments().map(
                item => ({
                    date: item.date,
                    label:
                        `Pagamento · ${item.debtName}`,
                    amount:
                        -Number(item.amount)
                })
            ),

            ...monthFund().map(
                item => ({
                    date: item.date,
                    label:
                        item.type === 'add'
                            ? 'Fundo · reforço'
                            : 'Fundo · levantamento',
                    amount:
                        item.type === 'add'
                            ? -Number(item.amount)
                            : Number(item.amount)
                })
            ),

            ...monthGoals().map(
                item => ({
                    date: item.date,
                    label:
                        `Objetivo · ${item.goalName}`,
                    amount:
                        -Number(item.amount)
                })
            )

        ].sort(
            (a, b) =>
                b.date.localeCompare(a.date)
        );


        const label =
            new Intl.DateTimeFormat(
                'pt-PT',
                {
                    month: 'long',
                    year: 'numeric'
                }
            ).format(
                new Date(
                    `${currentMonth}-01T12:00:00`
                )
            );


        const out =
            sum(
                rows,
                item =>
                    item.amount < 0
                        ? -item.amount
                        : 0
            );


        report.innerHTML = `
            <div class="print-report-header">

                <div>

                    <p>
                        AUREA FINANÇAS
                    </p>

                    <h1>
                        Relatório mensal
                    </h1>

                    <span>
                        ${esc(label)}
                    </span>

                </div>

                <strong>
                    ${money.format(
                        available(currentMonth)
                    )}
                </strong>

            </div>


            <div class="print-report-metrics">

                <div>
                    <span>Salário</span>
                    <b>
                        ${money.format(state.salary)}
                    </b>
                </div>

                <div>
                    <span>Saídas</span>
                    <b>
                        ${money.format(out)}
                    </b>
                </div>

                <div>
                    <span>Disponível</span>
                    <b>
                        ${money.format(
                            available(currentMonth)
                        )}
                    </b>
                </div>

            </div>


            <h2>
                Movimentos
            </h2>


            ${
                rows.length
                    ? `
                        <table>

                            <thead>

                                <tr>
                                    <th>Data</th>
                                    <th>Descrição</th>
                                    <th>Valor</th>
                                </tr>

                            </thead>

                            <tbody>

                                ${rows.map(item => `
                                    <tr>

                                        <td>
                                            ${esc(item.date)}
                                        </td>

                                        <td>
                                            ${esc(item.label)}
                                        </td>

                                        <td
                                            class="${
                                                item.amount >= 0
                                                    ? 'in'
                                                    : 'out'
                                            }"
                                        >
                                            ${
                                                item.amount >= 0
                                                    ? '+'
                                                    : ''
                                            }

                                            ${money.format(
                                                item.amount
                                            )}
                                        </td>

                                    </tr>
                                `).join('')}

                            </tbody>

                        </table>
                    `
                    : `
                        <p>
                            Sem movimentos neste mês.
                        </p>
                    `
            }


            <footer>
                Gerado pela Aurea Finanças
                · Desenvolvido por Carlos Sá
            </footer>
        `;


        window.print();
    }


    /* =========================================================
       CLIQUES
       ========================================================= */

    document.addEventListener(
        'click',
        event => {

            const categoryButton =
                event.target.closest(
                    '[data-category-choice]'
                );


            if (categoryButton) {

                event.preventDefault();


                const category =
                    categoryButton.dataset
                        .categoryChoice;


                const input =
                    $('expenseCategoryValue');


                if (input) {

                    input.value =
                        category;
                }


                document
                    .querySelectorAll(
                        '[data-category-choice]'
                    )
                    .forEach(button => {

                        button.classList.toggle(
                            'selected',
                            button ===
                            categoryButton
                        );
                    });


                return;
            }


            const button =
                event.target.closest(
                    '[data-action]'
                );


            if (!button) {
                return;
            }


            const action =
                button.dataset.action;


            const id =
                button.dataset.id;


            event.preventDefault();

            if (action === 'toggle-more') {

    const moreMenu =
        $('mobileMoreMenu');


    const moreButton =
        document.querySelector(
            '.mobile-more-button'
        );


    if (!moreMenu) {
        return;
    }


    const isOpen =
        moreMenu.classList.contains(
            'open'
        );


    moreMenu.classList.toggle(
        'open',
        !isOpen
    );


    if (moreButton) {

        moreButton.setAttribute(
            'aria-expanded',
            String(!isOpen)
        );

    }


    return;
}

/* =========================================================
   FECHAR MENU MAIS AO CLICAR FORA
   ========================================================= */


            if (action === 'navigate') {

                navigate(
                    button.dataset.section
                );

                return;
            }


            if (action === 'open-settings') {

                open(
                    'settingsOverlay'
                );

                return;
            }


            if (action === 'close-settings') {

                close(
                    'settingsOverlay'
                );

                return;
            }


            if (action === 'close-dynamic') {

                close(
                    'dynamicModal'
                );

                return;
            }


            if (action === 'close-chat') {

                close(
                    'chatOverlay'
                );

                return;
            }


            if (action === 'set-theme') {

                state.theme =
                    button.dataset.themeValue;

                save();

                render();

                return;
            }


            if (action === 'set-accent') {

                state.accent =
                    button.dataset.accentValue;

                save();

                render();

                return;
            }


            if (action === 'export-pdf') {

                exportPdf();

                return;
            }


            /* =================================================
               CHAT
               ================================================= */

            if (action === 'open-chat') {

                openChat();

                return;
            }


            if (action === 'quick-chat') {

                openChat();


                const question =
                    button.dataset.question;


                addChatMessage(
                    question,
                    'user'
                );


                setTimeout(
                    () => {

                        addChatMessage(
                            answerQuestion(
                                question
                            )
                        );

                    },
                    40
                );


                return;
            }


            if (
                action === 'previous-month' ||
                action === 'next-month'
            ) {

                const date =
                    new Date(
                        `${currentMonth}-01T12:00:00`
                    );


                date.setMonth(
                    date.getMonth() +
                    (
                        action === 'next-month'
                            ? 1
                            : -1
                    )
                );


                currentMonth =
                    `${date.getFullYear()}-${String(
                        date.getMonth() + 1
                    ).padStart(2, '0')}`;


                render();

                return;
            }


            if (action === 'delete-all') {

                if (
                    confirm(
                        'Apagar TODOS os dados da Aurea? Esta ação não pode ser desfeita.'
                    )
                ) {

                    localStorage.removeItem(
                        KEY
                    );


                    LEGACY_KEYS.forEach(
                        key =>
                            localStorage.removeItem(
                                key
                            )
                    );


                    location.reload();
                }


                return;
            }


            if (
                action === 'add-expense' ||
                action === 'edit-expense'
            ) {

                const item =
                    state.expenses.find(
                        expense =>
                            expense.id === id
                    ) || {};


                showModal(
                    action === 'edit-expense'
                        ? 'Editar despesa'
                        : 'Nova despesa',

                    dynamicForm(
                        'expense',
                        item
                    )
                );


                return;
            }


            if (
                action === 'delete-expense'
            ) {

                if (
                    confirm(
                        'Eliminar esta despesa?'
                    )
                ) {

                    state.expenses =
                        state.expenses.filter(
                            expense =>
                                expense.id !== id
                        );


                    save();

                    render();

                    showToast(
                        'Despesa eliminada.'
                    );
                }


                return;
            }


            if (
                action === 'add-debt' ||
                action === 'edit-debt'
            ) {

                const item =
                    state.debts.find(
                        debt =>
                            debt.id === id
                    ) || {};


                showModal(
                    action === 'edit-debt'
                        ? 'Editar dívida'
                        : 'Nova dívida',

                    dynamicForm(
                        'debt',
                        item
                    )
                );


                return;
            }


            if (
                action === 'delete-debt'
            ) {

                if (
                    confirm(
                        'Eliminar esta dívida e os pagamentos associados?'
                    )
                ) {

                    state.debts =
                        state.debts.filter(
                            debt =>
                                debt.id !== id
                        );


                    save();

                    render();

                    showToast(
                        'Dívida eliminada.'
                    );
                }


                return;
            }


            if (
                action === 'pay-debt'
            ) {

                const debt =
                    state.debts.find(
                        item =>
                            item.id === id
                    );


                if (debt) {

                    showModal(
                        'Registar pagamento',
                        dynamicForm(
                            'payment',
                            debt
                        )
                    );
                }


                return;
            }


            if (
                action === 'add-fund' ||
                action === 'edit-fund'
            ) {

                const item =
                    state.fund.find(
                        movement =>
                            movement.id === id
                    ) || {};


                showModal(
                    action === 'edit-fund'
                        ? 'Editar movimento'
                        : 'Novo movimento',

                    dynamicForm(
                        'fund',
                        item
                    )
                );


                return;
            }


            if (
                action === 'delete-fund'
            ) {

                if (
                    confirm(
                        'Eliminar este movimento do fundo?'
                    )
                ) {

                    state.fund =
                        state.fund.filter(
                            movement =>
                                movement.id !== id
                        );


                    save();

                    render();

                    showToast(
                        'Movimento eliminado.'
                    );
                }


                return;
            }


            if (
                action === 'add-goal' ||
                action === 'edit-goal'
            ) {

                const item =
                    state.goals.find(
                        goal =>
                            goal.id === id
                    ) || {};


                showModal(
                    action === 'edit-goal'
                        ? 'Editar objetivo'
                        : 'Novo objetivo',

                    dynamicForm(
                        'goal',
                        item
                    )
                );


                return;
            }


            if (
                action === 'goal-add'
            ) {

                showModal(
                    'Adicionar dinheiro',

                    dynamicForm(
                        'goaladd',
                        { id }
                    )
                );


                return;
            }


            if (
                action === 'delete-goal'
            ) {

                if (
                    confirm(
                        'Eliminar este objetivo?'
                    )
                ) {

                    state.goals =
                        state.goals.filter(
                            goal =>
                                goal.id !== id
                        );


                    save();

                    render();

                    showToast(
                        'Objetivo eliminado.'
                    );
                }


                return;
            }


            if (
                action === 'add-subscription' ||
                action === 'edit-subscription'
            ) {

                const item =
                    state.subscriptions.find(
                        subscription =>
                            subscription.id === id
                    ) || {};


                showModal(
                    action === 'edit-subscription'
                        ? 'Editar subscrição'
                        : 'Nova subscrição',

                    dynamicForm(
                        'subscription',
                        item
                    )
                );


                return;
            }


            if (
                action === 'delete-subscription'
            ) {

                if (
                    confirm(
                        'Eliminar esta subscrição?'
                    )
                ) {

                    state.subscriptions =
                        state.subscriptions.filter(
                            subscription =>
                                subscription.id !== id
                        );


                    save();

                    render();

                    showToast(
                        'Subscrição eliminada.'
                    );
                }


                return;
            }

        }
    );
/* =========================================================
   FECHAR MENU "MAIS" AO CLICAR FORA
   ========================================================= */

document.addEventListener(
    'click',
    event => {

        const moreMenu =
            $('mobileMoreMenu');


        const moreButton =
            document.querySelector(
                '.mobile-more-button'
            );


        if (
            !moreMenu ||
            !moreButton
        ) {
            return;
        }


        if (
            !moreMenu.classList.contains(
                'open'
            )
        ) {
            return;
        }


        const clickedInsideMenu =
            event.target.closest(
                '#mobileMoreMenu'
            );


        const clickedMoreButton =
            event.target.closest(
                '.mobile-more-button'
            );


        if (
            clickedInsideMenu ||
            clickedMoreButton
        ) {
            return;
        }


        moreMenu.classList.remove(
            'open'
        );


        moreButton.setAttribute(
            'aria-expanded',
            'false'
        );

    }
);

    /* =========================================================
       FORMULÁRIOS FIXOS
       ========================================================= */

    document.addEventListener(
        'submit',
        event => {

            const form =
                event.target;


            if (!form) {
                return;
            }


            if (
                form.id ===
                'welcomeForm'
            ) {

                event.preventDefault();


                const name =
                    $('welcomeName')
                        ?.value
                        .trim() || '';


                if (!name) {

                    showToast(
                        'Indica o teu nome.'
                    );

                    return;
                }


                state.profile.name =
                    name;


                save();

                close(
                    'welcomeOverlay'
                );

                render();

                return;
            }


            if (
                form.id ===
                'profileForm'
            ) {

                event.preventDefault();


                state.profile.name =
                    $('settingsName')
                        ?.value
                        .trim() || '';


                state.profile.birthDate =
                    $('settingsBirthDate')
                        ?.value || '';


                save();

                render();

                showToast(
                    'Perfil guardado.'
                );

                return;
            }


            if (
                form.id ===
                'financeForm'
            ) {

                event.preventDefault();


                state.salary =
                    Math.max(
                        0,
                        Number(
                            String(
                                $('settingsSalary')
                                    ?.value || 0
                            ).replace(',', '.')
                        )
                    );


                state.fundTarget =
                    Math.max(
                        1,
                        Number(
                            String(
                                $('settingsFundTarget')
                                    ?.value || 1000
                            ).replace(',', '.')
                        )
                    );


                save();

                render();

                showToast(
                    'Dados financeiros guardados.'
                );

                return;
            }


            if (
                form.id === 'addFundForm' ||
                form.id === 'removeFundForm'
            ) {

                event.preventDefault();


                const adding =
                    form.id ===
                    'addFundForm';


                const amount =
                    positiveNumber(
                        $(
                            adding
                                ? 'fundAddAmount'
                                : 'fundRemoveAmount'
                        )?.value
                    );


                const date =
                    $(
                        adding
                            ? 'fundAddDate'
                            : 'fundRemoveDate'
                    )?.value ||
                    today();


                if (!amount) {

                    showToast(
                        'Indica um valor válido.'
                    );

                    return;
                }


                if (
                    !adding &&
                    amount > fundBalance()
                ) {

                    showToast(
                        'Não podes levantar mais do que tens no fundo.'
                    );

                    return;
                }


                state.fund.push({

                    id: uid(),

                    type:
                        adding
                            ? 'add'
                            : 'remove',

                    amount,

                    date

                });


                save();

                render();

                form.reset();


                const dateInput =
                    $(
                        adding
                            ? 'fundAddDate'
                            : 'fundRemoveDate'
                    );


                if (dateInput) {
                    dateInput.value =
                        today();
                }


                showToast(
                    adding
                        ? 'Dinheiro adicionado ao fundo.'
                        : 'Dinheiro retirado do fundo.'
                );


                return;
            }


            if (
                form.id ===
                'chatForm'
            ) {

                event.preventDefault();


                const input =
                    $('chatInput');


                const question =
                    input
                        ?.value
                        .trim();


                if (!question) {
                    return;
                }


                addChatMessage(
                    question,
                    'user'
                );


                input.value =
                    '';


                setTimeout(
                    () => {

                        addChatMessage(
                            answerQuestion(
                                question
                            )
                        );

                    },
                    40
                );


                return;
            }

        }
    );


    /* =========================================================
       SELEÇÃO DE CATEGORIA
       ========================================================= */

    document.addEventListener(
        'change',
        event => {

            if (
                event.target.matches(
                    '#expenseCategoryValue'
                )
            ) {
                return;
            }

        }
    );


    /* =========================================================
       FECHAR OVERLAYS AO CLICAR FORA
       ========================================================= */

    document
        .querySelectorAll('.overlay')
        .forEach(overlay => {

            overlay.addEventListener(
                'click',
                event => {

                    if (
                        event.target ===
                        overlay
                    ) {

                        overlay.classList.add(
                            'hidden'
                        );
                    }
                }
            );
        });


    /* =========================================================
   SERVICE WORKER
   ========================================================= */

if ('serviceWorker' in navigator) {

    window.addEventListener('load', async () => {

        try {

            const registration =
                await navigator.serviceWorker.register(
                    './service-worker.js',
                    {
                        scope: './',
                        updateViaCache: 'none'
                    }
                );

            console.log(
                'Aurea Service Worker registado:',
                registration.scope
            );

            await registration.update();

        } catch (error) {

            console.error(
                'Aurea Service Worker ERRO:',
                error
            );
        }

    });

}


    /* =========================================================
       DATAS DO FUNDO
       ========================================================= */

    if ($('fundAddDate')) {

        $('fundAddDate').value =
            today();
    }


    if ($('fundRemoveDate')) {

        $('fundRemoveDate').value =
            today();
    }


    /* =========================================================
       ARRANQUE
       ========================================================= */

    render();

function hasExistingUserData() {
    const profile = state.profile || {};

    return Boolean(
        profile.name?.trim() ||
        profile.birthDate ||
        Number(state.salary) > 0 ||
        (state.expenses && state.expenses.length > 0) ||
        (state.debts && state.debts.length > 0) ||
        (state.fund && state.fund.length > 0) ||
        (state.goals && state.goals.length > 0) ||
        (state.subscriptions && state.subscriptions.length > 0)
    );
}

if (!hasExistingUserData()) {
    open('welcomeOverlay');
} else {
    document.getElementById('welcomeOverlay')?.classList.add('hidden');
}

})();