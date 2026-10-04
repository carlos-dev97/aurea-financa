"use strict";

(() => {
'use strict';

const KEY='aurea_financas_v7';
const LEGACY_KEYS=[
    'aurea_financas_v6',
    'aurea_financas_v5',
    'aurea_financas_v4'
];

const $=id=>document.getElementById(id);

const today=()=>{
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const ym=d=>String(d||'').slice(0,7);

const uid=()=>`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;

const sum=(a,fn=x=>x)=>
    (a||[]).reduce((t,x)=>t+Number(fn(x)||0),0);

const esc=v=>String(v??'').replace(
    /[&<>"']/g,
    c=>({
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '"':'&quot;',
        "'":'&#39;'
    })[c]
);

const positiveNumber=v=>{
    const n=Number(
        String(v??'').replace(',','.').trim()
    );

    return Number.isFinite(n)&&n>0
        ?Math.round(n*100)/100
        :0;
};

const CATEGORIES=[
    'Alimentação',
    'Carro',
    'Lazer',
    'Compras',
    'Contas',
    'Saúde',
    'Outros'
];

const CATEGORY_DATA={
    'Alimentação':[
        'food',
        '<svg viewBox="0 0 24 24"><path d="M7 3v8"/><path d="M4 3v5a3 3 0 0 0 6 0V3"/><path d="M7 11v10"/><path d="M17 3v18"/><path d="M17 3c3 2 3 7 0 9"/></svg>'
    ],
    'Carro':[
        'car',
        '<svg viewBox="0 0 24 24"><path d="M5 17h14"/><path d="M6 17l1-7h10l1 7"/><path d="M8 10l1.2-3h5.6l1.2 3"/><circle cx="8" cy="17" r="1.5"/><circle cx="16" cy="17" r="1.5"/></svg>'
    ],
    'Lazer':[
        'fun',
        '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/></svg>'
    ],
    'Compras':[
        'shopping',
        '<svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>'
    ],
    'Contas':[
        'bills',
        '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/></svg>'
    ],
    'Saúde':[
        'health',
        '<svg viewBox="0 0 24 24"><path d="M12 20S4 15 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 6-8 11-8 11z"/><path d="M12 7v6"/><path d="M9 10h6"/></svg>'
    ],
    'Outros':[
        'other',
        '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M8 12h8M12 8v8"/></svg>'
    ]
};

function normalizeCategory(c){
    const x=String(c||'Outros');

    return x==='Combustível'||x==='Combustivel'
        ?'Carro'
        :CATEGORIES.includes(x)
            ?x
            :'Outros';
}

function categoryIcon(name){
    const [c,icon]=
        CATEGORY_DATA[normalizeCategory(name)]||
        CATEGORY_DATA.Outros;

    return `<div class="category-icon ${c}">${icon}</div>`;
}

const defaults={
    profile:{
        name:'',
        birthDate:''
    },
    incomes:[],
    safetyMargin:0,
    currency:'EUR',
    fundTarget:1000,
    fund:[],
    debts:[],
    expenses:[],
    subscriptions:[],
    goals:[],
    theme:'light',
    accent:'gold'
};

function cloneDefaults(){
    return JSON.parse(JSON.stringify(defaults));
}

function load(){
    let saved=null;

    for(const k of [KEY,...LEGACY_KEYS]){
        try{
            const r=localStorage.getItem(k);

            if(r){
                saved=JSON.parse(r);

                if(saved)break;
            }
        }catch{}
    }

    return normalizeState(saved);
}

function normalizeState(saved){
    const b=cloneDefaults();

    const s={
        ...b,
        ...(saved||{}),

        profile:{
            ...b.profile,
            ...(saved?.profile||{})
        },

        fund:Array.isArray(saved?.fund)
            ?saved.fund
            :[],

        debts:Array.isArray(saved?.debts)
            ?saved.debts
            :[],

        incomes:Array.isArray(saved?.incomes)
            ?saved.incomes
            :[],

        expenses:Array.isArray(saved?.expenses)
            ?saved.expenses
            :[],

        subscriptions:Array.isArray(saved?.subscriptions)
            ?saved.subscriptions
            :[],

        goals:Array.isArray(saved?.goals)
            ?saved.goals
            :[]
    };

    s.salary=Number(s.salary||0);

    s.safetyMargin=Math.max(
        0,
        Number(s.safetyMargin||0)
    );

    s.currency=['EUR','USD','GBP','CHF','BRL'].includes(s.currency)
        ?s.currency
        :'EUR';

    s.fundTarget=Math.max(
        0,
        Number(s.fundTarget)||0
    );

    if(
        !Array.isArray(saved?.incomes)&&
        s.salary>0
    ){
        s.incomes=[{
            id:uid(),
            type:'Salário',
            description:'Salário',
            amount:s.salary,
            date:today()
        }];
    }

    s.incomes=s.incomes.map(x=>({
        ...x,
        id:x.id||uid(),
        type:String(x.type||'Outro'),
        description:String(x.description||''),
        amount:Number(x.amount||0),
        date:x.date||today()
    }));

    s.expenses=s.expenses.map(x=>({
        ...x,
        id:x.id||uid(),
        category:normalizeCategory(x.category),
        description:String(x.description||''),
        amount:Number(x.amount||0),
        date:x.date||today()
    }));

    s.debts=s.debts.map(d=>({
        ...d,
        id:d.id||uid(),
        name:String(d.name||'Dívida'),
        total:Number(d.total||0),
        monthly:Number(d.monthly||0),

        payments:Array.isArray(d.payments)
            ?d.payments.map(p=>({
                ...p,
                id:p.id||uid(),
                amount:Number(p.amount||0),
                date:p.date||today()
            }))
            :[]
    }));

    s.fund=s.fund.map(x=>({
        ...x,
        id:x.id||uid(),
        type:x.type==='remove'?'remove':'add',
        amount:Number(x.amount||0),
        date:x.date||today(),
        description:String(x.description||'')
    }));

    s.subscriptions=s.subscriptions.map(x=>({
        ...x,
        id:x.id||uid(),
        name:String(x.name||''),
        amount:Number(x.amount||0),
        day:Number(x.day||1)
    }));

    s.goals=s.goals.map(x=>({
        ...x,
        id:x.id||uid(),
        name:String(x.name||''),
        target:Number(x.target||0),
        saved:Number(x.saved||0),

        contributions:Array.isArray(x.contributions)
            ?x.contributions.map(c=>({
                ...c,
                id:c.id||uid(),
                amount:Number(c.amount)||0,
                date:c.date||today()
            }))
            :[],

        date:x.date||''
    }));

    delete s.salary;

    return s;
}

let state=load();
let currentSection='home';
let currentMonth=ym(today());
let editing=null;

function save(){
    try{
        localStorage.setItem(
            KEY,
            JSON.stringify(state)
        );
    }catch{}
}

function money(v){
    const currency=['EUR','USD','GBP','CHF','BRL'].includes(state.currency)
        ?state.currency
        :'EUR';

    try{
        return new Intl.NumberFormat('pt-PT',{
            style:'currency',
            currency
        }).format(Number(v||0));
    }catch{
        return `${Number(v||0).toFixed(2)} ${currency}`;
    }
}

function formatDate(d){
    const value=String(d||'');

    if(!/^\d{4}-\d{2}-\d{2}$/.test(value)){
        return '—';
    }

    const [y,m,day]=value.split('-');

    return `${day}/${m}/${y}`;
}

function monthLabel(m){
    const [y,mo]=String(m).split('-');

    if(!y||!mo)return m;

    const names=[
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro'
    ];

    return `${names[Number(mo)-1]||mo} ${y}`;
}

function monthIncomes(m=currentMonth){
    return state.incomes.filter(
        x=>ym(x.date)===m
    );
}

function totalIncome(m=currentMonth){
    return sum(
        monthIncomes(m),
        x=>x.amount
    );
}

function monthExpenses(m=currentMonth){
    return state.expenses.filter(
        x=>ym(x.date)===m
    );
}

function totalExpenses(m=currentMonth){
    return sum(
        monthExpenses(m),
        x=>x.amount
    );
}

function monthFundAdds(m=currentMonth){
    return sum(
        state.fund.filter(
            x=>x.type==='add'&&ym(x.date)===m
        ),
        x=>x.amount
    );
}

function monthGoalContributions(m=currentMonth){
    return sum(
        state.goals.flatMap(g=>
            (g.contributions||[]).filter(
                x=>ym(x.date)===m
            )
        ),
        x=>x.amount
    );
}

function monthDebtPayments(m=currentMonth){
    return sum(
        state.debts.flatMap(d=>
            (d.payments||[]).filter(
                p=>ym(p.date)===m
            )
        ),
        x=>x.amount
    );
}

function fundBalance(){
    return Math.round(
        sum(
            state.fund,
            x=>x.type==='remove'
                ?-Number(x.amount||0)
                :Number(x.amount||0)
        )*100
    )/100;
}

function debtPaid(debt){
    return sum(
        debt?.payments,
        p=>p.amount
    );
}

function debtBalance(debt){
    return Math.max(
        0,
        Math.round(
            (
                Number(debt?.total||0)-
                debtPaid(debt)
            )*100
        )/100
    );
}

function totalDebtBalance(){
    return sum(
        state.debts,
        debtBalance
    );
}

function monthFundWithdrawals(m = currentMonth) {
  return sum(
    state.fund.filter(x => x.type === 'remove' && ym(x.date) === m),
    x => x.amount
  );
}

function available() {
  const income = totalIncome(currentMonth);
  const expenses = totalExpenses(currentMonth);
  const debts = monthDebtPayments(currentMonth);
  const fund = monthFundAdds(currentMonth);
  const withdrawals = monthFundWithdrawals(currentMonth);
  const goals = monthGoalContributions(currentMonth);

  return Math.round(
    (income - expenses - debts - fund + withdrawals - goals) * 100
  ) / 100;
}

function spendingPlan(){
    const balance=available();

    const protectedAmount=Math.max(
        0,
        Number(state.safetyMargin)||0
    );

    return {
        balance,
        protectedAmount,
        freeAmount:Math.round(
            (balance-protectedAmount)*100
        )/100,
        margin:protectedAmount
    };
}

function greeting(){
    const h=new Date().getHours();

    if(h<12)return 'Bom dia';
    if(h<19)return 'Boa tarde';

    return 'Boa noite';
}

function birthdayMessage(){
    const birth=String(
        state.profile?.birthDate||''
    );

    if(!birth)return '';

    const now=today();

    if(birth.slice(5)===now.slice(5)){
        return `Feliz aniversário, ${state.profile?.name||''}! 🎂`;
    }

    return '';
}

function applyTheme(){
    document.documentElement.dataset.theme=
        state.theme||'light';

    document.documentElement.dataset.accent=
        state.accent||'gold';

    document.body.classList.toggle(
        'dark-theme',
        state.theme==='dark'
    );
}

function showToast(message){
    let toast=$('toast');

    if(!toast){
        toast=document.createElement('div');
        toast.id='toast';
        toast.className='toast';
        document.body.appendChild(toast);
    }

    toast.textContent=message;
    toast.classList.add('show');

    clearTimeout(showToast.timer);

    showToast.timer=setTimeout(()=>{
        toast.classList.remove('show');
    },2600);
}

function openModal(html){
    const modal=$('dynamicModal');

    if(!modal)return;

    const body=modal.querySelector('.modal-body');

    if(body)body.innerHTML=html;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');

    document.body.classList.add('modal-open');

    setTimeout(()=>{
        const first=modal.querySelector(
            'input:not([type="hidden"]),select,textarea'
        );

        if(first)first.focus();
    },40);
}

function closeModal(){
    const modal=$('dynamicModal');

    if(!modal)return;

    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');

    document.body.classList.remove('modal-open');

    editing=null;
}

function openChat(){
    const chat=$('chatModal');

    if(!chat)return;

    chat.classList.add('open');
    chat.setAttribute('aria-hidden','false');

    const input=$('chatInput');

    if(input){
        setTimeout(()=>input.focus(),50);
    }
}

function closeChat(){
    const chat=$('chatModal');

    if(!chat)return;

    chat.classList.remove('open');
    chat.setAttribute('aria-hidden','true');
}

function goalSavingsPlan(goal, referenceDate = today()) {

    const target = Math.max(
        0,
        Math.round((Number(goal.target) || 0) * 100)
    );

    const saved = Math.max(
        0,
        Math.round((Number(goal.saved) || 0) * 100)
    );

    const remaining = Math.max(0, target - saved);

    if (!target) {
        return {
            status: 'target',
            remaining: 0,
            months: 0,
            monthly: 0
        };
    }

    if (!remaining) {
        return {
            status: 'complete',
            remaining: 0,
            months: 0,
            monthly: 0
        };
    }

    const deadline = String(goal.date || '');

    if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
        return {
            status: 'date',
            remaining: remaining / 100,
            months: 0,
            monthly: 0
        };
    }

    if (deadline < referenceDate) {
        return {
            status: 'overdue',
            remaining: remaining / 100,
            months: 0,
            monthly: 0
        };
    }

    const [year, month] =
        deadline.split('-').map(Number);

    const [currentYear, currentMonthNumber] =
        referenceDate.split('-').map(Number);

    const months =
        (year - currentYear) * 12 +
        month - currentMonthNumber + 1;

    return {
        status: 'active',
        remaining: remaining / 100,
        months,
        monthly: Math.ceil(remaining / months) / 100
    };

}


function goalPlanMarkup(goal) {

    const plan = goalSavingsPlan(goal);

    if (plan.status === 'target') {
        return `
            <div class="goal-plan">
                <span>
                    Indica o valor pretendido para
                    calcular a poupança mensal.
                </span>
            </div>
        `;
    }

    if (plan.status === 'complete') {
        return `
            <div class="goal-plan">
                <strong class="positive">
                    Objetivo alcançado! ✓
                </strong>
            </div>
        `;
    }

    if (plan.status === 'date') {
        return `
            <div class="goal-plan">
                <span>
                    Falta juntar ${money(plan.remaining)}.
                </span>
                <small>
                    Define uma data limite para
                    calcular a poupança mensal.
                </small>
            </div>
        `;
    }

    if (plan.status === 'overdue') {
        return `
            <div class="goal-plan">
                <strong>Prazo terminado</strong>
                <span>
                    Falta juntar ${money(plan.remaining)}.
                </span>
                <small>
                    Atualiza a data limite para refazer o plano.
                </small>
            </div>
        `;
    }

    return `
        <div class="goal-plan">
            <span>Poupança mensal recomendada</span>

            <strong>
                ${money(plan.monthly)}
                <small> / mês</small>
            </strong>

            <small>
                Falta juntar ${money(plan.remaining)}
                em ${plan.months}
                ${plan.months === 1 ? 'mês' : 'meses'},
                incluindo este mês.
            </small>
        </div>
    `;

}


function updateGoalPreview(form) {

    if (!(form instanceof HTMLFormElement)) {
        return;
    }

    const preview = form.querySelector(
        '#goalPlanPreview'
    );

    if (!preview) {
        return;
    }

    const data = Object.fromEntries(
        new FormData(form).entries()
    );

    const goal = state.goals.find(
        g => g.id === data.id
    );

    preview.innerHTML = goalPlanMarkup({
        target: positiveNumber(data.target),

        saved:
            positiveNumber(data.saved) +
            sum(goal?.contributions, c => c.amount),

        date: data.date || ''
    });

}

const INCOME_ICONS = {
  'Salário':
    '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12a22 22 0 0 0 18 0M12 11v3"/>',

  'Freelance':
    '<rect x="4" y="3" width="16" height="12" rx="2"/><path d="M2 20h20l-2-5H4zM9 7l-2 2 2 2M15 7l2 2-2 2"/>',

  'Extra':
    '<circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/>',

  'Prémio':
    '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8H8a3 3 0 1 1 3-3l1 3ZM12 8h4a3 3 0 1 0-3-3l-1 3Z"/>',

  'Outro':
    '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 7V5a2 2 0 0 1 2-2h13v3M16 11h5v5h-5z"/>'
};

function incomeIcon(type) {
  return `
    <div class="category-icon income-icon">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        ${INCOME_ICONS[type] || INCOME_ICONS.Outro}
      </svg>
    </div>
  `;
}

function iconSelect(label, name, options, value) {
  const selected = options.includes(value) ? value : options[0];
  const iconFor = name === 'category' ? categoryIcon : incomeIcon;

  return `
    <div class="icon-select">
      <span class="icon-select-label">${esc(label)}</span>

      <details>
        <summary>
          <span class="icon-selection" data-selected-icon>
            ${iconFor(selected)}
            <span>${esc(selected)}</span>
          </span>
          <span aria-hidden="true">⌄</span>
        </summary>

        <fieldset class="icon-options">
          <legend class="sr-only">${esc(label)}</legend>

          ${options.map(option => `
            <label class="icon-option">
              <input
                type="radio"
                name="${esc(name)}"
                value="${esc(option)}"
                data-icon-option
                ${option === selected ? 'checked' : ''}
              >
              ${iconFor(option)}
              <span>${esc(option)}</span>
            </label>
          `).join('')}
        </fieldset>
      </details>
    </div>
  `;
}

function updateIconSelect(input) {
  const details = input.closest('.icon-select details');
  if (!details) return;

  const iconFor = input.name === 'category' ? categoryIcon : incomeIcon;

  details.querySelector('[data-selected-icon]').innerHTML =
    iconFor(input.value) + `<span>${esc(input.value)}</span>`;

  details.open = false;
  details.querySelector('summary').focus();
}

function dynamicForm(kind,id=null,extra={}){
    const lists={
        income:state.incomes,
        expense:state.expenses,
        debt:state.debts,
        fund:state.fund,
        subscription:state.subscriptions,
        goal:state.goals
    };

    const debt=state.debts.find(
        x=>x.id===extra.debtId
    );

    const goal=state.goals.find(
        x=>x.id===extra.goalId
    );

    const item=(
        kind==='payment'
            ?debt?.payments
            :kind==='contribution'
                ?goal?.contributions
                :lists[kind]
    )?.find(x=>x.id===id);

    if(
        (id&&!item)||
        (kind==='payment'&&!debt)||
        (kind==='contribution'&&!goal)
    ){
        showToast('Registo não encontrado.');
        return;
    }

    const names={
        income:'receita',
        expense:'despesa',
        debt:'dívida',
        payment:'pagamento',
        fund:'movimento',
        subscription:'subscrição',
        goal:'objetivo',
        contribution:'contribuição'
    };

    const title=kind==='fundTarget'
        ?'Definir meta do fundo'
        :`${item?'Editar':'Registar'} ${names[kind]||''}`;

    const input=(
        label,
        name,
        value='',
        type='text',
        attrs=''
    )=>`
        <label>
            ${label}
            <input
                type="${type}"
                name="${name}"
                value="${esc(value)}"
                ${attrs}
            >
        </label>
    `;

    const amount=(
        label,
        name,
        value='',
        min='0.01',
        attrs=''
    )=>input(
        label,
        name,
        value,
        'number',
        `min="${min}" step="0.01" required ${attrs}`
    );

    const date=(value=today())=>input(
        'Data',
        'date',
        value,
        'date',
        'required'
    );

    const select=(
        label,
        name,
        options,
        value
    )=>`
        <label>
            ${label}
            <select name="${name}">
                ${options.map(([v,n])=>`
                    <option
                        value="${esc(v)}"
                        ${v===value?'selected':''}
                    >${esc(n)}</option>
                `).join('')}
            </select>
        </label>
    `;

    let fields=`
        <input
            type="hidden"
            name="kind"
            value="${esc(kind)}"
        >
        <input
            type="hidden"
            name="id"
            value="${esc(id||'')}"
        >
    `;

    if (kind === 'income') {
  fields +=
    iconSelect(
      'Tipo',
      'type',
      Object.keys(INCOME_ICONS),
      item?.type || 'Salário'
    )
    + input('Descrição', 'description', item?.description || '')
    + amount('Valor', 'amount', item?.amount ?? '')
    + date(item?.date || today());
}

if (kind === 'expense') {
  fields +=
    input(
      'Descrição',
      'description',
      item?.description || '',
      'text',
      'required'
    )
    + iconSelect(
      'Categoria',
      'category',
      CATEGORIES,
      item?.category || CATEGORIES[0]
    )
    + amount('Valor', 'amount', item?.amount ?? '')
    + date(item?.date || today());
}

    if (kind === 'debt') {
  fields +=
    input('Nome da dívida', 'name', item?.name || '', 'text', 'required')
    + amount('Valor total', 'total', item?.total ?? '')
    + input(
      'N.º de prestações / parcelas (opcional)',
      'installments',
      item?.installments ?? '',
      'number',
      'min="1" step="1" placeholder="Ex.: 12"'
    )
    + amount('Prestação mensal', 'monthly', item?.monthly ?? 0, '0')
    + `<p class="muted">
        Podes deixar o número de prestações em branco.
        Se o preencheres e deixares a prestação mensal a zero,
        a Aurea calcula uma estimativa: valor total dividido
        pelo número de prestações.
      </p>`;
}

    if(kind==='payment'){
        const remaining=Math.round(
            (
                debtBalance(debt)+
                Number(item?.amount||0)
            )*100
        )/100;

        fields+=`
            <input
                type="hidden"
                name="debtId"
                value="${esc(debt.id)}"
            >
            <input
                type="hidden"
                name="paymentId"
                value="${esc(item?.id||'')}"
            >
            <div class="form-info">
                <strong>${esc(debt.name)}</strong>
                <span>
                    Valor máximo: ${money(remaining)}
                </span>
            </div>
        `+
        amount(
            'Valor do pagamento',
            'amount',
            item?.amount??(
                Math.min(
                    debt.monthly,
                    remaining
                )||''
            ),
            '0.01',
            `max="${remaining}"`
        )+
        date(item?.date||today());
    }

    if(kind==='fund'){
        fields+=
            select(
                'Movimento',
                'type',
                [
                    ['add','Adicionar ao fundo'],
                    ['remove','Retirar do fundo']
                ],
                item?.type||'add'
            )+
            amount(
                'Valor',
                'amount',
                item?.amount??''
            )+
            input(
                'Descrição',
                'description',
                item?.description||''
            )+
            date(item?.date||today());
    }

    if(kind==='fundTarget'){
        fields+=amount(
            'Meta do fundo de emergência',
            'target',
            state.fundTarget,
            '0'
        );
    }

    if(kind==='subscription'){
        fields+=
            input(
                'Nome',
                'name',
                item?.name||'',
                'text',
                'required'
            )+
            amount(
                'Valor mensal',
                'amount',
                item?.amount??0,
                '0'
            )+
            input(
                'Dia de cobrança',
                'day',
                item?.day||1,
                'number',
                'min="1" max="31" step="1" required'
            );
    }

    if (kind === 'goal') {

    const baseline = Math.max(
        0,
        Math.round(
            (
                Number(item?.saved || 0) -
                sum(item?.contributions, c => c.amount)
            ) * 100
        ) / 100
    );

    fields +=
        input(
            'Nome do objetivo',
            'name',
            item?.name || '',
            'text',
            'required'
        ) +

        amount(
            'Valor pretendido',
            'target',
            item?.target ?? ''
        ) +

        amount(
            'Poupança já existente',
            'saved',
            baseline,
            '0'
        ) +

        input(
            'Data limite',
            'date',
            item?.date || '',
            'date',
            'required'
        ) +

        `
            <div
                id="goalPlanPreview"
                aria-live="polite"
            ></div>

            <p class="muted">
                Usa Contribuir para registar novas poupanças.
                Os valores mensais são uma previsão;
                só as contribuições registadas são
                descontadas do saldo.
            </p>
        `;

}

    if(kind==='contribution'){
        fields+=`
            <input
                type="hidden"
                name="goalId"
                value="${esc(goal.id)}"
            >
            <div class="form-info">
                <strong>${esc(goal.name)}</strong>
            </div>
        `+
        amount(
            'Valor',
            'amount',
            item?.amount??''
        )+
        date(item?.date||today());
    }

    openModal(`
        <div class="modal-header">
            <div>
                <h2>${title}</h2>
                <p>Preenche os dados abaixo.</p>
            </div>
            <button
                type="button"
                class="icon-button"
                data-action="close-modal"
                aria-label="Fechar"
            >×</button>
        </div>

        <form
            id="dynamicForm"
            class="dynamic-form"
        >
            ${fields}

            <div class="modal-actions">
                <button
                    type="button"
                    class="secondary-button"
                    data-action="close-modal"
                >Cancelar</button>

                <button
                    type="submit"
                    class="primary-button"
                >Guardar</button>
            </div>
        </form>
    `);
    
    if (kind === 'goal') {
    updateGoalPreview($('dynamicForm'));
}

}

function emptyState(title,text){
    return `
        <div class="empty-state">
            <h3>${esc(title)}</h3>
            <p>${esc(text)}</p>
        </div>
    `;
}

function actionButton(
    action,
    text,
    attrs='',
    danger=false
){
    return `
        <button
            type="button"
            class="small-button${danger?' danger':''}"
            data-action="${action}"
            ${attrs}
        >${text}</button>
    `;
}

function row(
    title,
    subtitle,
    amount,
    positive,
    icon,
    actions=''
){
    return `
        <div class="list-row">
            <div class="item-main">
                ${icon}
                <div>
                    <strong>${esc(title)}</strong>
                    <span>${esc(subtitle)}</span>
                </div>
            </div>

            <div
                class="item-value ${
                    positive===true
                        ?'positive'
                        :positive===false
                            ?'negative'
                            :''
                }"
            >
                ${
                    positive===true
                        ?'+'
                        :positive===false
                            ?'−'
                            :''
                }${money(amount)}
            </div>

            ${
                actions
                    ?`<div class="item-actions">${actions}</div>`
                    :''
            }
        </div>
    `;
}

function itemActions(kind,id){
    const attrs=`data-id="${esc(id)}"`;

    return (
        actionButton(
            'edit-'+kind,
            'Editar',
            attrs
        )+
        actionButton(
            'delete-'+kind,
            'Apagar',
            attrs,
            true
        )
    );
}

function dateSort(a,b){
    return String(b.date).localeCompare(
        String(a.date)
    );
}

function renderAureaRecommendations() {
  const card = $('advisorCard');
  if (!card) return;

  const p = spendingPlan();
  const now = today();
  const thisMonth = ym(now);

  const [year, month] = currentMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  const daysLeft = currentMonth === thisMonth
    ? daysInMonth - Number(now.slice(8)) + 1
    : daysInMonth;

  const daily = Math.floor(
    Math.max(0, Math.round(p.freeAmount * 100)) / daysLeft
  ) / 100;

  const dailyText = currentMonth < thisMonth
    ? `O saldo livre no fecho deste mês é ${money(p.freeAmount)}.`
    : `${money(daily)} por dia. O saldo livre foi distribuído por ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}${currentMonth === thisMonth ? ' até ao fim do mês, incluindo hoje' : ' desse mês'}.`;

  const fund = fundBalance();
  const target = Math.max(0, Number(state.fundTarget) || 0);
  const missing = Math.max(
    0,
    Math.round((target - fund) * 100) / 100
  );

  const fundText = !target
    ? 'Define uma meta para o teu fundo de emergência.'
    : missing > 0
      ? `Já tens ${money(fund)}. Faltam ${money(missing)} para a meta de ${money(target)}. Reforça o fundo quando houver espaço no teu orçamento.`
      : `Meta alcançada! Tens ${money(fund)} reservados para imprevistos.`;

  const plans = state.goals.map(goal => ({
    goal,
    plan: goalSavingsPlan(goal)
  }));

  const active = plans.filter(x => x.plan.status === 'active');

  const monthly = Math.round(
    sum(active, x => x.plan.monthly) * 100
  ) / 100;

  const overdue = plans.filter(
    x => x.plan.status === 'overdue'
  ).length;

  const incomplete = plans.filter(
    x => ['date', 'target'].includes(x.plan.status)
  ).length;

  let goalsText = !plans.length
    ? 'Cria um objetivo com valor, poupança existente e data limite para receberes um plano mensal.'
    : active.length
      ? `O plano dos objetivos atuais pede ${money(monthly)} por mês no total. ${active.slice(0, 3).map(x => `${x.goal.name}: ${money(x.plan.monthly)}/mês`).join(' · ')}${active.length > 3 ? ' · e outros objetivos' : ''}.`
      : 'Os objetivos com valor e prazo definidos já estão concluídos.';

  if (!active.length && (overdue || incomplete)) {
    goalsText = 'Revê os objetivos que precisam de um novo plano.';
  }

  if (overdue) {
    goalsText += ` Há ${overdue} ${overdue === 1 ? 'objetivo com o prazo terminado' : 'objetivos com o prazo terminado'}. Atualiza a data limite.`;
  }

  if (incomplete) {
    goalsText += ' Preenche os valores e as datas em falta.';
  }

  const alertText = p.balance < 0
    ? `Os movimentos registados excedem o dinheiro disponível em ${money(-p.balance)}. Revê as despesas deste mês.`
    : p.freeAmount < 0
      ? `Faltam ${money(-p.freeAmount)} para manter a margem que escolheste proteger. Revê as despesas ou ajusta essa margem.`
      : p.freeAmount === 0
        ? 'O saldo livre está a zero. Uma nova despesa reduzirá a margem protegida ou deixará o saldo negativo.'
        : currentMonth === thisMonth && monthly > p.freeAmount
          ? `A previsão mensal dos objetivos (${money(monthly)}) ultrapassa o saldo livre atual (${money(p.freeAmount)}). Revê os prazos ou o plano de poupança.`
          : `Tens ${money(p.freeAmount)} livres depois de proteger ${money(p.protectedAmount)}. Conta também com as despesas que ainda vais registar.`;

  const tips = [
    [
      currentMonth < thisMonth ? 'Resumo do mês' : 'Orçamento por dia',
      dailyText
    ],
    ['Fundo de emergência', fundText],
    ['Objetivos atuais', goalsText],
    ['Atenção ao orçamento', alertText]
  ];

  card.innerHTML = `
    <div class="advisor-head">
      <div>
        <span class="eyebrow">Aurea</span>
        <h3>Recomendações para ti</h3>
      </div>
      <span class="advisor-icon">✦</span>
    </div>

    <div class="advisor-details">
      <div>
        <span>Saldo antes da margem</span>
        <strong>${money(p.balance)}</strong>
      </div>
      <div>
        <span>Margem protegida</span>
        <strong>${money(p.protectedAmount)}</strong>
      </div>
    </div>

    <div class="aurea-tips">
      ${tips.map(([title, text]) => `
        <div class="aurea-tip">
          <strong>${esc(title)}</strong>
          <p>${esc(text)}</p>
        </div>
      `).join('')}
    </div>

    <p class="aurea-note">
      Previsões com base nos movimentos registados.
      As sugestões de poupança são atualizadas quando registas contribuições.
      ${currentMonth !== thisMonth
        ? 'O fundo e os objetivos mostram os valores atuais.'
        : ''}
    </p>
  `;
}

function renderIncomes() {
  const items = [...monthIncomes()].sort(dateSort);

  $('incomeMonthTotal').textContent = money(totalIncome());

  $('incomesList').innerHTML = items.length
    ? items.map(x => row(
        x.description || x.type,
        `${x.type} · ${formatDate(x.date)}`,
        x.amount,
        true,
        incomeIcon(x.type),
        itemActions('income', x.id)
      )).join('')
    : emptyState(
        'Sem receitas',
        'Regista a primeira entrada deste mês.'
      );
}

function renderHome(){
    const name=state.profile?.name?.trim();

    const greetingEl=$('homeGreeting');

    if(greetingEl){
        greetingEl.textContent=
            `${greeting()}${name?', '+name:''}`;
    }

    const metricIncome=$('metricSalary');

    if(metricIncome){
        metricIncome.textContent=
            money(totalIncome(currentMonth));
    }

    const metricAvailable=$('metricAvailable');

    if(metricAvailable){
        metricAvailable.textContent=
            money(spendingPlan().freeAmount);
    }

    const metricDebt=$('metricDebt');

    if(metricDebt){
        metricDebt.textContent=
            money(totalDebtBalance());
    }

    const metricFund=$('metricFund');

    if(metricFund){
        metricFund.textContent=
            money(fundBalance());
    }

    const birthday=$('birthdayMessage');

    if(birthday){
        const msg=birthdayMessage();

        birthday.innerHTML=msg
            ?`
                <div class="birthday-card">
                    <div class="birthday-icon">🎂</div>
                    <div>
                        <strong>${esc(msg)}</strong>
                        <span>
                            Que este novo ano de vida te traga saúde, felicidade e grandes conquistas, 
                            tanto nas tuas finanças como na tua vida pessoal. 
                            Que tenhas coragem para seguir os teus sonhos e muitos motivos para celebrar. ✨
                        </span>
                    </div>
                </div>
            `
            :'';
    }

    const advisor=$('advisorCard');

    if(advisor){
        const p=spendingPlan();

        advisor.innerHTML=`
            <div class="advisor-head">
                <div>
                    <span class="eyebrow">Aurea</span>
                    <h3>Visão deste mês</h3>
                </div>
                <span class="advisor-icon">✦</span>
            </div>

            <p>
                ${
                    p.freeAmount>=0
                        ?`
                            Tens
                            <strong>${money(p.freeAmount)}</strong>
                            livres depois da margem
                            que escolheste proteger.
                        `
                        :`
                            Faltam
                            <strong>${money(-p.freeAmount)}</strong>
                            para cobrir os movimentos
                            e a margem deste mês.
                        `
                }
            </p>

            <div class="advisor-details">
                <div>
                    <span>Saldo antes da margem</span>
                    <strong>${money(p.balance)}</strong>
                </div>
                <div>
                    <span>Margem protegida</span>
                    <strong>${money(p.protectedAmount)}</strong>
                </div>
            </div>
        `;
    }

    const recent=$('recentActivity');

    if(recent){
        const activities=[];

        state.incomes
            .filter(x=>ym(x.date)===currentMonth)
            .forEach(x=>activities.push({
                date:x.date,
                title:x.description||x.type,
                type:'income',
                amount:x.amount
            }));

        state.expenses
            .filter(x=>ym(x.date)===currentMonth)
            .forEach(x=>activities.push({
                date:x.date,
                title:x.description,
                type:'expense',
                amount:x.amount
            }));

        state.debts.forEach(d=>{
            (d.payments||[])
                .filter(x=>ym(x.date)===currentMonth)
                .forEach(x=>activities.push({
                    date:x.date,
                    title:`Pagamento — ${d.name}`,
                    type:'expense',
                    amount:x.amount
                }));
        });

        activities.sort(dateSort);

        const top=activities.slice(0,6);

        recent.innerHTML=top.length
            ?top.map(x=>`
                <div class="activity-row">
                    <div>
                        <strong>${esc(x.title)}</strong>
                        <span>${formatDate(x.date)}</span>
                    </div>

                    <strong
                        class="${
                            x.type==='income'
                                ?'positive'
                                :'negative'
                        }"
                    >
                        ${x.type==='income'?'+':'-'}${money(x.amount)}
                    </strong>
                </div>
            `).join('')
            :`
                <div class="empty-state compact">
                    <p>
                        Ainda não existem movimentos este mês.
                    </p>
                </div>
            `;
    }
}

function renderFund(){
    const balance=fundBalance();
    const target=state.fundTarget;

    const percent=target>0
        ?Math.max(
            0,
            Math.min(
                100,
                balance/target*100
            )
        )
        :0;

    $('fundCurrent').textContent=money(balance);
    $('fundTarget').textContent=money(target);
    $('fundPercent').textContent=`${percent.toFixed(0)}%`;
    $('fundProgress').style.width=`${percent}%`;

    $('fundList').innerHTML=state.fund.length
        ?[...state.fund]
            .sort(dateSort)
            .map(x=>row(
                x.description||(
                    x.type==='add'
                        ?'Entrada no fundo'
                        :'Retirada do fundo'
                ),
                formatDate(x.date),
                x.amount,
                x.type==='add',
                '<div class="item-icon">◇</div>',
                itemActions('fund',x.id)
            ))
            .join('')
        :emptyState(
            'Fundo vazio',
            'Define uma meta e faz o primeiro reforço.'
        );
}

function renderDebts(){
    $('debtsList').innerHTML=state.debts.length
        ?state.debts.map(d=>{
            const paid=debtPaid(d);
            const balance=debtBalance(d);

            const percent=d.total>0
                ?Math.min(
                    100,
                    paid/d.total*100
                )
                :0;

            const payments=[...d.payments]
                .sort(dateSort)
                .map(x=>`
                    <div class="payment-row">
                        <div>
                            <strong>${money(x.amount)}</strong>
                            <span>${formatDate(x.date)}</span>
                        </div>

                        <div class="item-actions">
                            ${actionButton(
                                'edit-payment',
                                'Editar',
                                `data-debt-id="${esc(d.id)}" data-payment-id="${esc(x.id)}"`
                            )}

                            ${actionButton(
                                'delete-payment',
                                'Apagar',
                                `data-debt-id="${esc(d.id)}" data-payment-id="${esc(x.id)}"`,
                                true
                            )}
                        </div>
                    </div>
                `).join('');

            return `
                <article class="debt-card">
                    <div class="debt-head">
                        <div>
                            <h3>${esc(d.name)}</h3>
                            <span>${d.installments ? `${esc(d.installments)} ${Number(d.installments) === 1 ? 'prestação' : 'prestações'} · ` : ''}Prestação: ${money(d.monthly)}/mês</span>
                        </div>

                        <div class="item-actions">
                            ${itemActions('debt',d.id)}
                        </div>
                    </div>

                    <div class="debt-values">
                        <div>
                            <span>Total</span>
                            <strong>${money(d.total)}</strong>
                        </div>
                        <div>
                            <span>Pago</span>
                            <strong>${money(paid)}</strong>
                        </div>
                        <div>
                            <span>Em falta</span>
                            <strong>${money(balance)}</strong>
                        </div>
                    </div>

                    <div class="progress-bar">
                        <div style="width:${percent}%"></div>
                    </div>

                    <div class="debt-footer">
                        <span>${percent.toFixed(0)}% pago</span>

                        <button
                            type="button"
                            class="primary-button small"
                            data-action="add-payment"
                            data-debt-id="${esc(d.id)}"
                            ${balance<=0?'disabled':''}
                        >
                            Registar pagamento
                        </button>
                    </div>

                    <div class="payments-list">
                        ${
                            payments||
                            `
                                <div class="empty-mini">
                                    Ainda não existem
                                    pagamentos registados.
                                </div>
                            `
                        }
                    </div>
                </article>
            `;
        }).join('')
        :emptyState(
            'Ainda não tens dívidas',
            'Quando tiveres uma, podes registá-la aqui.'
        );
}

function renderExpenses(){
    const items=[...monthExpenses()].sort(dateSort);

    $('expenseMonthTotal').textContent=
        money(totalExpenses());

    $('expensesList').innerHTML=items.length
        ?items.map(x=>row(
            x.description,
            `${x.category} · ${formatDate(x.date)}`,
            x.amount,
            false,
            categoryIcon(x.category),
            itemActions('expense',x.id)
        )).join('')
        :emptyState(
            'Sem despesas',
            'Não tens despesas registadas neste mês.'
        );
}

function renderSubscriptions(){
    $('subscriptionsList').innerHTML=
        state.subscriptions.length
            ?state.subscriptions.map(x=>row(
                x.name,
                `Dia ${x.day} · mensal`,
                x.amount,
                null,
                '<div class="item-icon">↻</div>',
                itemActions('subscription',x.id)
            )).join('')
            :emptyState(
                'Sem subscrições',
                'Regista os teus serviços recorrentes.'
            );
}

function renderGoals(){
    $('goalsList').innerHTML=state.goals.length
        ?state.goals.map(g=>{
            const percent=g.target>0
                ?Math.min(
                    100,
                    g.saved/g.target*100
                )
                :0;

            const contributions=[...g.contributions]
                .sort(dateSort)
                .map(c=>`
                    <div class="payment-row">
                        <div>
                            <strong>${money(c.amount)}</strong>
                            <span>${formatDate(c.date)}</span>
                        </div>

                        <div class="item-actions">
                            ${actionButton(
                                'edit-contribution',
                                'Editar',
                                `data-goal-id="${esc(g.id)}" data-id="${esc(c.id)}"`
                            )}

                            ${actionButton(
                                'delete-contribution',
                                'Apagar',
                                `data-goal-id="${esc(g.id)}" data-id="${esc(c.id)}"`,
                                true
                            )}
                        </div>
                    </div>
                `).join('');

            return `
                <article class="goal-card">
                    <div class="goal-head">
                        <div>
                            <h3>${esc(g.name)}</h3>

                            ${
                                g.date
                                    ?`<span>Até ${formatDate(g.date)}</span>`
                                    :''
                            }
                        </div>

                        <div class="item-actions">
                            ${itemActions('goal',g.id)}
                        </div>
                    </div>

                    <div class="goal-values">
                        <strong>${money(g.saved)}</strong>
                        <span>de ${money(g.target)}</span>
                    </div>

                    <div class="progress-bar">
                        <div style="width:${percent}%"></div>
                    </div>

                    <div class="progress-bar">
    <div style="width:${percent}%"></div>
</div>

${goalPlanMarkup(g)}

                    <div class="debt-footer">
                        <span>
                            ${percent.toFixed(0)}% concluído
                        </span>

                        <button
                            type="button"
                            class="primary-button small"
                            data-action="add-contribution"
                            data-goal-id="${esc(g.id)}"
                        >
                            Contribuir
                        </button>
                    </div>

                    <div class="payments-list">
                        ${contributions}
                    </div>
                </article>
            `;
        }).join('')
        :emptyState(
            'Sem objetivos',
            'Cria um objetivo para começares a poupar com propósito.'
        );
}

function renderHistory(){
    const rows=[
        ...state.incomes.map(x=>({
            ...x,
            title:x.description||x.type,
            category:'Receita',
            positive:true
        })),

        ...state.expenses.map(x=>({
            ...x,
            title:x.description,
            positive:false
        })),

        ...state.debts.flatMap(d=>
            d.payments.map(x=>({
                ...x,
                title:`Pagamento — ${d.name}`,
                category:'Dívida',
                positive:false
            }))
        ),

        ...state.fund.map(x=>({
            ...x,
            title:x.description||'Fundo de emergência',
            category:x.type==='add'
                ?'Fundo'
                :'Retirada do fundo',
            positive:x.type==='remove'
        })),

        ...state.goals.flatMap(g=>
            g.contributions.map(x=>({
                ...x,
                title:`Contribuição — ${g.name}`,
                category:'Objetivo',
                positive:false
            }))
        )
    ];

    $('historyList').innerHTML = rows.length
  ? rows.sort(dateSort).map(x => row(
      x.title,
      `${x.category} · ${formatDate(x.date)}`,
      x.amount,
      x.positive,
      x.category === 'Receita'
        ? incomeIcon(x.type)
        : CATEGORIES.includes(x.category)
          ? categoryIcon(x.category)
          : '<div class="item-icon">↔</div>'
    )).join('')
  : emptyState(
      'Histórico vazio',
      'Os teus movimentos aparecerão aqui.'
    );
}

function renderStatistics(){
    const totalInc=totalIncome(currentMonth);
    const totalExp=totalExpenses(currentMonth);

    const incomeEl=$('statsIncome');

    for(const [id,value] of Object.entries({
        statsDebtPayments:monthDebtPayments(),
        statsFund:monthFundAdds(),
        statsGoals:monthGoalContributions(),
        statsMargin:state.safetyMargin,
        statsFree:spendingPlan().freeAmount
    })){
        if($(id)){
            $(id).textContent=money(value);
        }
    }

    const expenseEl=$('statsExpenses');
    const balanceEl=$('statsBalance');

    if(incomeEl){
        incomeEl.textContent=money(totalInc);
    }

    if(expenseEl){
        expenseEl.textContent=money(totalExp);
    }

    if(balanceEl){
        balanceEl.textContent=money(available());
    }

    const categories={};

    monthExpenses(currentMonth).forEach(x=>{
        const c=normalizeCategory(x.category);

        categories[c]=
            (categories[c]||0)+
            Number(x.amount||0);
    });

    const list=$('statsCategories');

    if(list){
        const sorted=Object.entries(categories)
            .sort((a,b)=>b[1]-a[1]);

        list.innerHTML=sorted.length
            ?sorted.map(([cat,value])=>`
                <div class="stat-row">
                    <div class="item-main">
                        ${categoryIcon(cat)}
                        <strong>${esc(cat)}</strong>
                    </div>
                    <strong>${money(value)}</strong>
                </div>
            `).join('')
            :`
                <div class="empty-state compact">
                    <p>
                        Ainda não existem despesas neste mês.
                    </p>
                </div>
            `;
    }
}

function renderSettings(){
    $('settingsName').value=state.profile.name;

    $('settingsBirthDate').value=
        state.profile.birthDate;

    $('settingsSafetyMargin').value=
        state.safetyMargin;

    $('settingsCurrency').value=
        state.currency;

    renderThemeChoices();
}

function render() {
  currentMonth = ym(today());

  applyTheme();
  renderHome();
  renderAureaRecommendations();
  renderIncomes();
  renderFund();
  renderDebts();
  renderExpenses();
  renderSubscriptions();
  renderGoals();
  renderHistory();
  renderStatistics();
  renderSettings();
  placePageActions();
}

function refreshCurrentMonth() {
  if (!document.hidden && currentMonth !== ym(today())) {
    render();
  }
}

document.addEventListener('visibilitychange', refreshCurrentMonth);
window.addEventListener('focus', refreshCurrentMonth);

function placePageActions() {
  const topbar = document.querySelector('.topbar');
  const actions = document.querySelector('.topbar-actions');

  if (!topbar || !actions) return;

  if (window.matchMedia('(max-width: 680px)').matches) {
    if (actions.parentElement !== topbar) {
      topbar.append(actions);
    }
    return;
  }

  const section = document.querySelector('.app-section.active');
  const heading = section?.querySelector(
    '.home-greeting, .section-heading'
  );

  if (!heading) return;

  let copy = heading.querySelector(':scope > .page-heading-copy');

  if (!copy) {
    if (heading.classList.contains('home-greeting')) {
      copy = document.createElement('div');
      copy.append(...heading.childNodes);
      heading.append(copy);
    } else {
      copy = heading.firstElementChild;
    }

    copy.classList.add('page-heading-copy');
  }

  let group = heading.querySelector(':scope > .page-heading-actions');

  if (!group) {
    group = document.createElement('div');
    group.className = 'page-heading-actions';

    [...heading.children]
      .filter(child => child !== copy)
      .forEach(child => group.append(child));

    heading.append(group);
  }

  if (actions.parentElement !== group) {
    group.append(actions);
  }
}

window.addEventListener('resize', placePageActions);

function showSection(section) {
    closeMoreMenu();
    currentSection = section;

    document.querySelectorAll('.app-section').forEach(el => {
        el.classList.toggle('active', el.dataset.section === section);
    });

    document.querySelectorAll('[data-section-target]').forEach(el => {
        el.classList.toggle(
            'active',
            el.dataset.sectionTarget === section
        );
    });

    document.querySelector('[data-action="open-more"]')
        ?.classList.toggle(
            'active',
            !['home', 'incomes', 'expenses'].includes(section)
        );

    placePageActions();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setMonth(delta){
    const d=new Date(
        `${currentMonth}-01T12:00:00`
    );

    d.setMonth(d.getMonth()+delta);

    currentMonth=
        `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;

    render();
}

function deleteConfirm(message){
    return window.confirm(
        message||'Tens a certeza que queres apagar?'
    );
}

function handleDynamicFormSubmit(event){
    event.preventDefault();
    event.stopPropagation();

    const form=event.target;

    if(!(form instanceof HTMLFormElement)){
        return;
    }

    const data=Object.fromEntries(
        new FormData(form).entries()
    );

    const kind=data.kind;
    const amount=positiveNumber(data.amount);
    const name=String(data.name||'').trim();
    const date=data.date||today();

    const nonnegative=v=>Math.max(
        0,
        Number(
            String(v||0).replace(',','.')
        )||0
    );

    const lists={
        income:state.incomes,
        expense:state.expenses,
        debt:state.debts,
        fund:state.fund,
        subscription:state.subscriptions,
        goal:state.goals
    };

    const list=lists[kind];

    const existing=list?.find(
        x=>x.id===data.id
    );

    if(list&&data.id&&!existing){
        showToast('Registo não encontrado.');
        return;
    }

    let item;
    let message='Registo guardado.';

    if(
        [
            'income',
            'expense',
            'fund',
            'payment',
            'contribution'
        ].includes(kind)&&
        !amount
    ){
        showToast('Indica um valor válido.');
        return;
    }

    if(kind==='income'){
        item={
            type:String(data.type||'Outro'),
            description:String(
                data.description||''
            ).trim(),
            amount,
            date
        };
    }

    else if(kind==='expense'){
        item={
            description:String(
                data.description||''
            ).trim(),
            category:normalizeCategory(data.category),
            amount,
            date
        };
    }

    else if (kind === 'debt') {
  const total = positiveNumber(data.total);

  if (!name || !total) {
    showToast('Preenche o nome e o valor total.');
    return;
  }

  if (existing && total < debtPaid(existing)) {
    showToast('O total não pode ser inferior aos pagamentos registados.');
    return;
  }

  const rawInstallments = String(data.installments || '').trim();
  const installments = rawInstallments ? Number(rawInstallments) : null;

  if (
    installments !== null &&
    (!Number.isSafeInteger(installments) || installments < 1)
  ) {
    showToast('Indica um número inteiro de prestações ou deixa o campo em branco.');
    return;
  }

  const enteredMonthly = nonnegative(data.monthly);
  const monthly = enteredMonthly || (
    installments
      ? Math.round(total / installments * 100) / 100
      : 0
  );

  item = { name, total, monthly, installments };

  if (!existing) item.payments = [];
}

    else if(kind==='payment'){
        const debt=state.debts.find(
            d=>d.id===data.debtId
        );

        if(!debt){
            showToast('Dívida não encontrada.');
            return;
        }

        const payment=debt.payments.find(
            p=>p.id===data.paymentId
        );

        if(data.paymentId&&!payment){
            showToast('Pagamento não encontrado.');
            return;
        }

        const remaining=Math.round(
            (
                debtBalance(debt)+
                Number(payment?.amount||0)
            )*100
        )/100;

        if(amount>remaining){
            showToast(
                `O pagamento não pode ultrapassar ${money(remaining)}.`
            );
            return;
        }

        if(payment){
            Object.assign(payment,{
                amount,
                date
            });
        }else{
            debt.payments.push({
                id:uid(),
                amount,
                date
            });
        }

        message=payment
            ?'Pagamento atualizado.'
            :'Pagamento registado.';
    }

    else if(kind==='fund'){
        const type=data.type==='remove'
            ?'remove'
            :'add';

        const withoutOld=fundBalance()-(
            existing
                ?(
                    existing.type==='add'
                        ?existing.amount
                        :-existing.amount
                )
                :0
        );

        if(
            Math.round(
                (
                    withoutOld+
                    (
                        type==='add'
                            ?amount
                            :-amount
                    )
                )*100
            )<0
        ){
            showToast(
                'Este movimento deixaria o fundo com saldo negativo.'
            );
            return;
        }

        item={
            type,
            amount,
            description:String(
                data.description||''
            ).trim(),
            date
        };
    }

    else if(kind==='fundTarget'){
        state.fundTarget=
            nonnegative(data.target);

        message='Meta do fundo atualizada.';
    }

    else if(kind==='subscription'){
        if(!name){
            showToast(
                'Indica o nome da subscrição.'
            );
            return;
        }

        item={
            name,
            amount:nonnegative(data.amount),
            day:Math.min(
                31,
                Math.max(
                    1,
                    Math.round(
                        Number(data.day)||1
                    )
                )
            )
        };
    }

    else if (kind === 'goal') {

    if (
        !name ||
        !positiveNumber(data.target)
    ) {
        showToast(
            'Preenche o objetivo e o valor pretendido.'
        );
        return;
    }

    item = {
        name,

        target: positiveNumber(data.target),

        date: data.date || '',

        saved: Math.round(
            (
                nonnegative(data.saved) +
                sum(
                    existing?.contributions,
                    c => c.amount
                )
            ) * 100
        ) / 100
    };

    if (!existing) {
        item.contributions = [];
    }

}

    else if(kind==='contribution'){
        const goal=state.goals.find(
            g=>g.id===data.goalId
        );

        if(!goal){
            showToast('Objetivo não encontrado.');
            return;
        }

        const c=goal.contributions.find(
            c=>c.id===data.id
        );

        if(data.id&&!c){
            showToast(
                'Contribuição não encontrada.'
            );
            return;
        }

        goal.saved=Math.round(
            (
                goal.saved+
                amount-
                Number(c?.amount||0)
            )*100
        )/100;

        if(c){
            Object.assign(c,{
                amount,
                date
            });
        }else{
            goal.contributions.push({
                id:uid(),
                amount,
                date
            });
        }

        message='Contribuição guardada.';
    }

    else if(!item){
        showToast('Formulário desconhecido.');
        return;
    }

    if(item){
        if(existing){
            Object.assign(existing,item);
        }else{
            list.push({
                id:uid(),
                ...item
            });
        }
    }

    save();
    closeModal();
    render();
    showToast(message);
}

function editIncome(id){
    dynamicForm('income',id);
}

function editExpense(id){
    dynamicForm('expense',id);
}

function editDebt(id){
    dynamicForm('debt',id);
}

function editFund(id){
    dynamicForm('fund',id);
}

function editSubscription(id){
    dynamicForm('subscription',id);
}

function editGoal(id){
    dynamicForm('goal',id);
}

function deleteIncome(id){
    if(!deleteConfirm('Apagar esta receita?')){
        return;
    }

    state.incomes=state.incomes.filter(
        x=>x.id!==id
    );

    save();
    render();
    showToast('Receita apagada.');
}

function deleteExpense(id){
    if(!deleteConfirm('Apagar esta despesa?')){
        return;
    }

    state.expenses=state.expenses.filter(
        x=>x.id!==id
    );

    save();
    render();
    showToast('Despesa apagada.');
}

function deleteDebt(id){
    if(!deleteConfirm(
        'Apagar esta dívida e todos os seus pagamentos?'
    )){
        return;
    }

    state.debts=state.debts.filter(
        x=>x.id!==id
    );

    save();
    render();
    showToast('Dívida apagada.');
}

function deletePayment(debtId,paymentId){
    const debt=state.debts.find(
        d=>d.id===debtId
    );

    if(!debt)return;

    if(!deleteConfirm('Apagar este pagamento?')){
        return;
    }

    debt.payments=(debt.payments||[]).filter(
        p=>p.id!==paymentId
    );

    save();
    render();
    showToast('Pagamento apagado.');
}

function deleteFund(id){
    if(!deleteConfirm(
        'Apagar este movimento do fundo?'
    )){
        return;
    }

    const movement=state.fund.find(
        x=>x.id===id
    );

    if(
        movement&&
        fundBalance()-(
            movement.type==='add'
                ?movement.amount
                :-movement.amount
        )<-0.005
    ){
        showToast(
            'Este movimento é necessário para cobrir as retiradas do fundo.'
        );
        return;
    }

    state.fund=state.fund.filter(
        x=>x.id!==id
    );

    save();
    render();
    showToast('Movimento apagado.');
}

function deleteSubscription(id){
    if(!deleteConfirm(
        'Apagar esta subscrição?'
    )){
        return;
    }

    state.subscriptions=
        state.subscriptions.filter(
            x=>x.id!==id
        );

    save();
    render();
    showToast('Subscrição apagada.');
}

function deleteGoal(id){
    if(!deleteConfirm('Apagar este objetivo?')){
        return;
    }

    state.goals=state.goals.filter(
        x=>x.id!==id
    );

    save();
    render();
    showToast('Objetivo apagado.');
}

function saveSettings(){
    state.profile.name=String(
        $('settingsName')?.value||''
    ).trim();

    state.profile.birthDate=
        $('settingsBirthDate')?.value||'';

    state.safetyMargin=Math.max(
        0,
        Number(
            String(
                $('settingsSafetyMargin')?.value||0
            ).replace(',','.')
        )
    );

    const currency=
        $('settingsCurrency')?.value||'EUR';

    state.currency=[
        'EUR',
        'USD',
        'GBP',
        'CHF',
        'BRL'
    ].includes(currency)
        ?currency
        :'EUR';

    save();
    render();
    showToast('Definições guardadas.');
}

function sendChat(question){
    const q=String(question||'').trim();

    if(!q)return;

    $('chatMessages').insertAdjacentHTML(
        'beforeend',
        `
            <div class="chat-message user">
                ${esc(q)}
            </div>
        `
    );

    $('chatInput').value='';

    answerQuestion(q);
}

function answerQuestion(question) {
  const q = String(question || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/−/g, '-')
    .trim();

  const p = spendingPlan();
  const round = value => Math.round(value * 100) / 100;
  const now = today();
  const [year, month, day] = now.split('-').map(Number);
  const days = new Date(year, month, 0).getDate() - day + 1;

  const daily = value => money(
    Math.floor(Math.max(0, Math.round(value * 100)) / days) / 100
  );

  const plans = state.goals.map(goal => ({
    goal,
    plan: goalSavingsPlan(goal)
  }));

  const active = plans.filter(x => x.plan.status === 'active');
  const goalMonthly = round(sum(active, x => x.plan.monthly));

  function parsePrice(raw) {
    let text = raw.replace(/\s/g, '');
    const comma = text.lastIndexOf(',');
    const dot = text.lastIndexOf('.');

    if (comma >= 0 && dot >= 0) {
      const separator = comma > dot ? ',' : '.';
      const position = text.lastIndexOf(separator);
      const decimals = text.slice(position + 1);

      if (!/^\d{1,2}$/.test(decimals)) return NaN;

      text =
        text.slice(0, position).replace(/[.,]/g, '')
        + '.' + decimals;

    } else if (comma >= 0) {
      if (!/^-?\d*,\d{1,2}$/.test(text)) return NaN;
      text = text.replace(',', '.');

    } else if (dot >= 0) {
      if (/^-?\d{1,3}(?:\.\d{3})+$/.test(text)) {
        text = text.replace(/\./g, '');
      } else if (!/^-?\d*\.\d{1,2}$/.test(text)) {
        return NaN;
      }
    }

    const value = Number(text);

    return Number.isFinite(value)
      && Number.isSafeInteger(Math.round(value * 100))
        ? round(value)
        : NaN;
  }

  const number = '-?(?:\\d+(?:[.,]\\d+|\\s\\d{3})*|[.,]\\d{1,2})';
  const unit = '(?:€|£|\\$|(?:euros?|eur|usd|gbp|chf|brl|reais)\\b)';

  const explicit = [...q.matchAll(
    new RegExp(`(${number})\\s*${unit}|${unit}\\s*(${number})`, 'g')
  )].map(x => x[1] || x[2]);

  const priced = [...q.matchAll(
    new RegExp(
      `(?:gastar|pagar|por|ate|custa(?:m|ria)?|custar|preco(?: de| e)?|valor(?: de| e)?)\\s+(${number})`,
      'g'
    )
  )].map(x => x[1]);

  const bare = new RegExp(
    `^(?:${unit}\\s*)?(${number})(?:\\s*${unit})?[.!?]?$`
  ).exec(q);

  let prices = explicit.length
    ? explicit
    : priced.length
      ? priced
      : bare ? [bare[1]] : [];

  if (!explicit.length && /\d\s*(?:e|ou)\s*-?\d/.test(q)) {
    prices = [...q.matchAll(new RegExp(number, 'g'))]
      .map(x => x[0]);
  }

  const followUp = answerQuestion.pendingPurchase && (
    bare
    || /^(?:custa|custaria|seriam|sao|fica por|o preco e)\b/.test(q)
  );

  const request =
    /posso|consigo|da para|chega para|tenho dinheiro para|vale a pena|boa ideia|achas|quero|simula/.test(q);

  const spending =
    followUp
    || request && (
      /gastar|comprar|pagar|jantar|almocar|isto|isso|aquilo/.test(q)
      || prices.length > 0
        && !/poupar|guardar|objetivo|fundo|margem|divida/.test(q)
    )
    || /^(?:gastar|comprar|pagar|jantar)\b/.test(q);

  const perDay =
    /(?:por dia|diario|diariamente)/.test(q)
    || Boolean(followUp && answerQuestion.pendingDaily);

  answerQuestion.pendingPurchase = false;
  answerQuestion.pendingDaily = false;

  let answer;

  if (perDay && (!spending || !prices.length)) {
    answer = `Tens ${money(p.freeAmount)} livres depois da margem protegida. Distribuindo esse saldo pelos ${days} ${days === 1 ? 'dia que falta' : 'dias que faltam'} até ao fim do mês, a referência é ${daily(p.freeAmount)} por dia.\n\nConta com as despesas que ainda vais registar.`;

  } else if (spending) {
    const currency = /r\$|\bbrl\b|reais/.test(q) ? 'BRL'
      : /€|\beuros?\b|\beur\b/.test(q) ? 'EUR'
      : /£|\bgbp\b/.test(q) ? 'GBP'
      : /\$|\busd\b/.test(q) ? 'USD'
      : /\bchf\b/.test(q) ? 'CHF'
      : null;

    if (currency && currency !== state.currency) {
      answerQuestion.pendingPurchase = true;
      answerQuestion.pendingDaily = perDay;

      answer = `A app está configurada em ${state.currency}. Indica o preço nessa moeda para fazer a simulação; não faço conversões cambiais.`;

    } else if (!prices.length) {
      answerQuestion.pendingPurchase = true;
      answerQuestion.pendingDaily = perDay;

      answer = `Quanto custaria? Diz-me o valor, por exemplo “${money(50)}”, e comparo com o teu saldo, a margem protegida e os objetivos.`;

    } else if (prices.length > 1) {
      answerQuestion.pendingPurchase = true;
      answerQuestion.pendingDaily = perDay;

      answer = `Encontrei mais de um valor. Qual é o ${perDay ? 'valor por dia' : 'custo total'} que queres analisar? Podes responder só com esse valor na moeda escolhida nas definições.`;

    } else {
      const price = parsePrice(prices[0]);
      const cost = round(price * (perDay ? days : 1));

      if (
        !Number.isFinite(cost)
        || cost <= 0
        || !Number.isSafeInteger(Math.round(cost * 100))
      ) {
        answerQuestion.pendingPurchase = true;
        answerQuestion.pendingDaily = perDay;

        answer = `Indica um preço positivo, por exemplo “${money(50)}” ou “${money(49.9)}”.`;

      } else {
        const after = round(p.freeAmount - cost);
        const cashAfter = round(p.balance - cost);

        if (cashAfter < 0) {
          answer = `Essa despesa de ${money(cost)} deixaria o saldo antes da margem negativo em ${money(-cashAfter)}. Pelos movimentos registados, o dinheiro disponível não chega para esse valor.`;

        } else if (after < 0) {
          answer = `Consegues pagar ${money(cost)} com o saldo antes da margem, mas ficariam apenas ${money(cashAfter)}. Para manter a margem de ${money(p.protectedAmount)}, faltariam ${money(-after)}. Eu ponderaria adiar um gasto que não seja urgente.`;

        } else {
          answer = `Pelos valores registados, ${money(cost)} cabem no saldo livre e mantêm a margem de ${money(p.protectedAmount)}. Depois desse gasto ficariam ${money(after)} livres, cerca de ${daily(after)} por dia até ao fim do mês.`;

          if (!after) {
            answer += '\n\nFicarias sem saldo livre para novas despesas.';
          } else if (cost >= p.freeAmount * 0.25) {
            answer += `\n\nEste gasto consumiria ${Math.round(cost / p.freeAmount * 100)}% do saldo livre atual. Se não for urgente, pondera o impacto nas despesas que ainda faltam.`;
          }
        }

        if (perDay) {
          answer = `${money(price)} por dia durante ${days} dias somariam ${money(cost)}.\n\n` + answer;
        }

        if (active.length) {
          answer += `\n\nO plano dos teus objetivos aponta para ${money(goalMonthly)}/mês no total.`;

          if (after >= 0 && after < goalMonthly) {
            answer += ` O saldo livre após esse gasto ficaria ${money(round(goalMonthly - after))} abaixo dessa previsão. Revê o plano ou os prazos se quiseres manter essa poupança.`;
          }
        }

        answer += '\n\nEsta é uma simulação com os registos atuais. Confirma também os encargos que ainda não registaste.';
      }
    }

  } else {
    const previous = /mes passado|mes anterior/.test(q);
    const reference = new Date(year, month - (previous ? 2 : 1), 1);

    const period =
      `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(2, '0')}`;

    const label = previous ? monthLabel(period) : 'este mês';

    const category = CATEGORIES.find(name =>
      q.includes(
        name.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
      )
    ) || (/combustivel/.test(q) ? 'Carro' : null);

    if (/receita|salario|ganhei|ganho/.test(q)) {
      answer = `Em ${label}, registaste ${money(totalIncome(period))} em receitas, em ${monthIncomes(period).length} entradas.`;

    } else if (/fundo|emergencia/.test(q)) {
      const balance = fundBalance();
      const target = Math.max(0, Number(state.fundTarget) || 0);

      answer = `O fundo tem ${money(balance)}. ${target ? `Faltam ${money(Math.max(0, round(target - balance)))} para a meta de ${money(target)}.` : 'Define uma meta para acompanhar o progresso.'}\n\nEste mês adicionaste ${money(monthFundAdds())} e levantaste ${money(monthFundWithdrawals())}. Os levantamentos devolvem dinheiro ao saldo disponível.`;

    } else if (/objetiv|poupar|poupanca|guardar|recomend|sugest/.test(q)) {
      answer = active.length
        ? `Os objetivos atuais pedem ${money(goalMonthly)}/mês no total:\n${active.slice(0, 5).map(x => `• ${x.goal.name}: ${money(x.plan.monthly)}/mês`).join('\n')}${active.length > 5 ? '\nConsulta os restantes na página Objetivos.' : ''}`
        : 'Não há objetivos com um plano mensal ativo. Cria um objetivo ou revê os valores e a data limite dos existentes.';

      if (plans.some(x => x.plan.status === 'overdue')) {
        answer += '\n\nHá objetivos com o prazo terminado. Atualiza as datas para refazer o plano.';
      }

      if (active.length && goalMonthly > Math.max(0, p.freeAmount)) {
        answer += '\n\nEssa previsão ultrapassa o saldo livre atual. Podes rever os prazos e os valores para tornar o plano mais confortável.';
      }

      answer += `\n\nA referência para despesas este mês é ${daily(p.freeAmount)} por dia, depois da margem protegida.`;

    } else if (/divida|emprestimo|prestac|parcela/.test(q)) {
      const open = state.debts.filter(debt => debtBalance(debt) > 0);

      answer = `Tens ${money(totalDebtBalance())} em dívidas por pagar. As prestações mensais indicadas nas dívidas em aberto somam ${money(sum(open, x => x.monthly))}.\n\nEm ${label}, registaste ${money(monthDebtPayments(period))} em pagamentos.`;

    } else if (/margem|proteg/.test(q)) {
      answer = `Escolheste proteger ${money(p.protectedAmount)}. O saldo antes dessa margem é ${money(p.balance)} e o saldo livre é ${money(p.freeAmount)}.\n\n${p.freeAmount < 0 ? 'O saldo atual não chega para manter toda a margem escolhida.' : 'Uma compra acima do saldo livre começaria a utilizar essa margem.'}`;

    } else if (category || /despesa|gastei|gasto|gastar|categoria/.test(q)) {
      const totals = {};

      monthExpenses(period).forEach(x => {
        totals[x.category] =
          (totals[x.category] || 0) + Number(x.amount || 0);
      });

      const sorted = Object.entries(totals)
        .sort((a, b) => b[1] - a[1]);

      answer = category
        ? `Em ${label}, registaste ${money(totals[category] || 0)} em ${category}.`
        : `Em ${label}, registaste ${money(totalExpenses(period))} em despesas. ${sorted.length ? `A categoria com mais gastos é ${sorted[0][0]}: ${money(sorted[0][1])}.` : 'Ainda não há despesas nesse mês.'}`;

    } else if (/saldo|disponivel|livre/.test(q)) {
      answer = `O saldo antes da margem é ${money(p.balance)}. Depois de proteger ${money(p.protectedAmount)}, tens ${money(p.freeAmount)} livres.\n\nA referência até ao fim do mês é ${daily(p.freeAmount)} por dia, com base nos movimentos já registados.`;

    } else if (/^(?:ola|oi|bom dia|boa tarde|boa noite|obrigad)/.test(q)) {
      answer = 'Olá! Posso ajudar-te a analisar uma compra, consultar despesas e acompanhar as poupanças. Experimenta: “Posso gastar 50 €?”';

    } else {
      answer = 'Experimenta uma destas perguntas:\n• Posso gastar 50 €?\n• Quanto posso gastar por dia?\n• Quanto gastei em alimentação?\n• Quanto gastei no mês passado?\n• Como estão os meus objetivos?\n• Como está o fundo?';
    }
  }

  const messages = $('chatMessages');

  if (messages) {
    messages.insertAdjacentHTML(
      'beforeend',
      `<div class="chat-message assistant">${esc(answer)}</div>`
    );

    const reply = messages.lastElementChild;

    messages.scrollTop +=
      reply.getBoundingClientRect().top
      - messages.getBoundingClientRect().top
      - 18;
  }
}

function printReport(){
    const report=$('printReport');

    report.innerHTML=`
        <h1>Aurea Finanças</h1>

        <p>
            ${esc(state.profile.name)}
            · ${monthLabel(currentMonth)}
        </p>

        <h2>Resumo mensal</h2>

        <p>Receitas: ${money(totalIncome())}</p>
        <p>Despesas: ${money(totalExpenses())}</p>

        <p>
            Pagamentos de dívidas:
            ${money(monthDebtPayments())}
        </p>

        <p>
            Reforços do fundo:
            ${money(monthFundAdds())}
        </p>

        <p>
            Contribuições para objetivos:
            ${money(monthGoalContributions())}
        </p>

        <p>
            Margem protegida:
            ${money(state.safetyMargin)}
        </p>

        <p>
            <strong>
                Saldo livre:
                ${money(spendingPlan().freeAmount)}
            </strong>
        </p>

        <h2>Movimentos</h2>
        ${$('historyList').innerHTML}

        <p>Desenvolvido por Carlos Sá</p>
    `;

    document.body.classList.add(
        'printing-report'
    );

    window.print();

    document.body.classList.remove(
        'printing-report'
    );
}

function exportData(){
    const blob=new Blob(
        [JSON.stringify(state,null,2)],
        {type:'application/json'}
    );

    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');

    a.href=url;
    a.download=`aurea-financas-${today()}.json`;

    document.body.appendChild(a);

    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}

function importData(file){
    if(!file)return;

    const reader=new FileReader();

    reader.onload=()=>{
        try{
            const imported=JSON.parse(
                reader.result
            );

            if(
                !imported||
                typeof imported!=='object'
            ){
                throw new Error();
            }

            const arrays=[
                'incomes',
                'expenses',
                'debts',
                'fund',
                'goals',
                'subscriptions'
            ];

            if(
                !arrays.some(
                    k=>Array.isArray(imported[k])
                )||
                arrays.some(
                    k=>
                        k in imported&&
                        !Array.isArray(imported[k])
                )
            ){
                throw new Error();
            }

            state=normalizeState(imported);
            save();
            render();
            showWelcome();
            showToast('Dados importados.');
        }catch{
            showToast(
                'Não foi possível importar os dados.'
            );
        }
    };

    reader.readAsText(file);
}

function deleteAllData() {
    if (!deleteConfirm(
        'Isto vai apagar todos os dados da Aurea. Continuar?'
    )) return;

    state = cloneDefaults();

    LEGACY_KEYS.forEach(key => localStorage.removeItem(key));

    save();
    closeModal();
    closeChat();
    closeSettings();

    answerQuestion.pendingPurchase = false;
    answerQuestion.pendingDaily = false;

    const messages = $('chatMessages');

    if (messages?.firstElementChild) {
        messages.replaceChildren(
            messages.firstElementChild.cloneNode(true)
        );
    }

    $('chatInput').value = '';

    showSection('home');
    render();
    showWelcome();

    showToast(
        'Todos os dados foram apagados. Cria o teu perfil para começar.'
    );
}

function setupEvents(){
        document.addEventListener(
        'input',
        event => {
            updateGoalPreview(
                event.target.closest('form')
            );
        }
    );
    document.addEventListener(
        'click',
        event=>{
            const button=event.target.closest(
                '[data-action]'
            );

            if(!button)return;

            const {
                action,
                id,
                debtId,
                paymentId,
                goalId
            }=button.dataset;

            const kinds=[
                'income',
                'expense',
                'debt',
                'fund',
                'subscription',
                'goal'
            ];

            for(const kind of kinds){
                if(action==='add-'+kind){
                    dynamicForm(kind);
                    return;
                }

                if(action==='edit-'+kind){
                    dynamicForm(kind,id);
                    return;
                }
            }

            const deletes={
                'delete-income':deleteIncome,
                'delete-expense':deleteExpense,
                'delete-debt':deleteDebt,
                'delete-fund':deleteFund,
                'delete-subscription':deleteSubscription,
                'delete-goal':deleteGoal
            };

            if(deletes[action]){
                deletes[action](id);
                return;
            }

            if(action==='navigate'){
                showSection(
                    button.dataset.section||'home'
                );
                return;
            }

            if(
                action==='prev-month'||
                action==='next-month'
            ){
                setMonth(
                    action==='prev-month'
                        ?-1
                        :1
                );
                return;
            }

            if(action==='today-month'){
                currentMonth=ym(today());
                render();
                return;
            }

            if(
                action==='add-payment'||
                action==='edit-payment'
            ){
                dynamicForm(
                    'payment',
                    action==='edit-payment'
                        ?paymentId
                        :null,
                    {debtId}
                );
                return;
            }

            if(action==='delete-payment'){
                deletePayment(
                    debtId,
                    paymentId
                );
                return;
            }

            if(
                action==='add-contribution'||
                action==='edit-contribution'
            ){
                dynamicForm(
                    'contribution',
                    id||null,
                    {goalId}
                );
                return;
            }

            if(action==='delete-contribution'){
                const g=state.goals.find(
                    g=>g.id===goalId
                );

                const c=g?.contributions.find(
                    c=>c.id===id
                );

                if(
                    c&&
                    deleteConfirm(
                        'Apagar esta contribuição?'
                    )
                ){
                    g.saved=Math.round(
                        (g.saved-c.amount)*100
                    )/100;

                    g.contributions=
                        g.contributions.filter(
                            x=>x.id!==id
                        );

                    save();
                    render();
                }

                return;
            }

            if(action==='edit-fund-target'){
                dynamicForm('fundTarget');
                return;
            }

            if(action==='open-chat'){
                openChat();
                return;
            }

            if(action==='close-chat'){
                closeChat();
                return;
            }

            if(action==='quick-chat'){
                sendChat(
                    button.dataset.question||
                    button.textContent
                );
                return;
            }

            if(action==='close-modal'){
                closeModal();
                return;
            }

            if(action==='open-settings'){
                renderSettings();

                $('settingsModal').classList.add(
                    'open'
                );

                $('settingsModal').setAttribute(
                    'aria-hidden',
                    'false'
                );

                return;
            }

            if(action==='close-settings'){
                closeSettings();
                return;
            }

            if(
                action==='theme'||
                action==='accent'
            ){
                state[
                    action==='theme'
                        ?'theme'
                        :'accent'
                ]=
                    action==='theme'
                        ?button.dataset.theme
                        :button.dataset.accentValue;

                save();
                applyTheme();
                renderThemeChoices();

                return;
            }

            if(action==='print-report'){
                printReport();
            }

            if(action==='export-data'){
                exportData();
            }

            if(action==='delete-all'){
                deleteAllData();
            }
        }
    );

    document.addEventListener(
    'submit',
    event => {

        const form = event.target;

        if (!(form instanceof HTMLFormElement)) {
            return;
        }

        const formId = form.getAttribute('id');

        if (formId === 'dynamicForm') {
            handleDynamicFormSubmit(event);
            return;
        }

        if (formId === 'financeForm') {
            event.preventDefault();
            saveSettings();
            return;
        }

        if (formId === 'chatForm') {
            event.preventDefault();
            sendChat($('chatInput').value);
        }

    }
);

    document.addEventListener('change', event => {
  if (event.target.matches('[data-icon-option]')) {
    updateIconSelect(event.target);
  }

  if (event.target.id === 'importFile') {
    importData(event.target.files?.[0]);
    event.target.value = '';
  }
});

    document.addEventListener(
        'keydown',
        event=>{
            if(event.key==='Escape'){
                closeModal();
                closeChat();
                closeSettings();
            }
        }
    );
}

function closeSettings(){
    $('settingsModal').classList.remove('open');

    $('settingsModal').setAttribute(
        'aria-hidden',
        'true'
    );
}

function renderThemeChoices(){
    document.querySelectorAll(
        '[data-accent-value]'
    ).forEach(b=>{
        b.classList.toggle(
            'active',
            b.dataset.accentValue===state.accent
        );
    });

    $('themeLight').classList.toggle(
        'active',
        state.theme==='light'
    );

    $('themeDark').classList.toggle(
        'active',
        state.theme==='dark'
    );
}

function showWelcome() {
    const welcome = $('welcomeOverlay');
    if (!welcome) return;

    const pending = !String(state.profile?.name || '').trim();

    document.body.classList.toggle('profile-pending', pending);
    welcome.classList.toggle('open', pending);
    welcome.setAttribute('aria-hidden', String(!pending));

    document.querySelectorAll(
        '.app-shell, .mobile-nav, .chat-fab, ' +
        '#settingsModal, #dynamicModal, #chatModal, #mobileMoreModal'
    ).forEach(el => {
        el.inert = pending;
    });

    if (!pending) return;

    $('welcomeForm').reset();
    $('welcomeName').setCustomValidity('');
    $('welcomeBirthDate').max = today();
    $('welcomeName').focus();
}

function setupWelcome() {
    const welcome = $('welcomeOverlay');
    const form = $('welcomeForm');
    if (!welcome || !form) return;

    const nameInput = $('welcomeName');

    nameInput.addEventListener('input', () => {
        nameInput.setCustomValidity('');
    });

    form.addEventListener('submit', event => {
        event.preventDefault();

        const name = nameInput.value.trim();

        nameInput.setCustomValidity(
            name ? '' : 'Indica o teu nome para começar.'
        );

        $('welcomeBirthDate').max = today();

        if (!form.reportValidity()) return;

        state.profile = {
            ...state.profile,
            name,
            birthDate: $('welcomeBirthDate').value
        };

        save();
        render();
        showWelcome();

        $('homeGreeting').setAttribute('tabindex', '-1');
        $('homeGreeting').focus();

        showToast(`Bem-vindo à Aurea, ${name}.`);
    });

    welcome.addEventListener('keydown', event => {
        if (event.key !== 'Tab') return;

        const first = nameInput;
        const last = form.querySelector('button[type="submit"]');

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    showWelcome();
}

function setupSettingsOverlay(){
    const settings=$('settingsModal');

    if(!settings)return;

    settings.addEventListener(
        'click',
        event=>{
            if(event.target===settings){
                settings.classList.remove(
                    'open'
                );

                settings.setAttribute(
                    'aria-hidden',
                    'true'
                );
            }
        }
    );
}

function setupDynamicModal(){
    const modal=$('dynamicModal');

    if(!modal)return;

    modal.addEventListener(
        'click',
        event=>{
            if(event.target===modal){
                closeModal();
            }
        }
    );
}

function setupChat(){
    const chat=$('chatModal');

    if(!chat)return;

    chat.addEventListener(
        'click',
        event=>{
            if(event.target===chat){
                closeChat();
            }
        }
    );
}

function setupServiceWorker(){
    if('serviceWorker' in navigator){
        window.addEventListener(
            'load',
            ()=>{
                navigator.serviceWorker
                    .register('./service-worker.js')
                    .catch(()=>{});
            }
        );
    }
}

function setupMobileNavigation() {
    const nav = document.querySelector('.mobile-nav');
    if (!nav) return;

    const primary = ['home', 'incomes', 'expenses'];
    const buttons = [
        ...document.querySelectorAll('.sidebar-nav button')
    ];

    const copies = primary
        .map(section => buttons.find(
            button => button.dataset.sectionTarget === section
        ))
        .filter(Boolean)
        .map(button => {
            const copy = button.cloneNode(true);
            copy.className = button.classList.contains('active')
                ? 'active'
                : '';
            return copy;
        });

    const more = document.createElement('button');
    more.type = 'button';
    more.dataset.action = 'open-more';
    more.setAttribute('aria-haspopup', 'dialog');
    more.setAttribute('aria-controls', 'mobileMoreModal');
    more.setAttribute('aria-expanded', 'false');

    more.innerHTML = `
        <span class="nav-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="5" cy="12" r="1"/>
                <circle cx="12" cy="12" r="1"/>
                <circle cx="19" cy="12" r="1"/>
            </svg>
        </span>
        <span>Mais</span>
    `;

    more.addEventListener('click', openMoreMenu);
    nav.replaceChildren(...copies, more);

    const modal = document.createElement('div');
    modal.id = 'mobileMoreModal';
    modal.className = 'overlay mobile-more-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('aria-labelledby', 'mobileMoreTitle');

    modal.innerHTML = `
        <div class="mobile-more-dialog">
            <div class="modal-header">
                <div>
                    <span class="eyebrow">Aurea Finanças</span>
                    <h2 id="mobileMoreTitle">Mais</h2>
                </div>
                <button type="button" class="icon-button"
                        data-close-more aria-label="Fechar menu">
                    ×
                </button>
            </div>
            <div class="mobile-more-links"></div>
        </div>
    `;

    const links = modal.querySelector('.mobile-more-links');

    buttons
        .filter(button => !primary.includes(
            button.dataset.sectionTarget
        ))
        .forEach(button => {
            const copy = button.cloneNode(true);
            copy.className = 'mobile-more-item';
            links.append(copy);
        });

    modal.addEventListener('click', event => {
        if (
            event.target === modal ||
            event.target.closest('[data-close-more]')
        ) {
            closeMoreMenu();
        }
    });

    modal.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            closeMoreMenu();
            return;
        }

        if (event.key !== 'Tab') return;

        const items = [...modal.querySelectorAll('button')];
        const first = items[0];
        const last = items.at(-1);

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (
            !event.shiftKey &&
            document.activeElement === last
        ) {
            event.preventDefault();
            first.focus();
        }
    });

    document.body.append(modal);

    window.matchMedia('(max-width: 680px)')
        .addEventListener('change', event => {
            if (!event.matches) closeMoreMenu();
        });
}

function openMoreMenu() {
    const modal = $('mobileMoreModal');

    if (
        !modal ||
        !window.matchMedia('(max-width: 680px)').matches
    ) return;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');

    document.querySelector('[data-action="open-more"]')
        .setAttribute('aria-expanded', 'true');

    document.querySelectorAll(
        '.app-shell, .mobile-nav, .chat-fab'
    ).forEach(el => {
        el.inert = true;
    });

    document.body.classList.add('modal-open');
    modal.querySelector('button').focus();
}

function closeMoreMenu() {
    const modal = $('mobileMoreModal');
    if (!modal?.classList.contains('open')) return;

    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');

    document.querySelectorAll(
        '.app-shell, .mobile-nav, .chat-fab'
    ).forEach(el => {
        el.inert = document.body.classList.contains(
            'profile-pending'
        );
    });

    document.body.classList.remove('modal-open');

    const more = document.querySelector(
        '[data-action="open-more"]'
    );

    more?.setAttribute('aria-expanded', 'false');

    if (window.matchMedia('(max-width: 680px)').matches) {
        more?.focus({ preventScroll: true });
    }
}

function init() {
    state.incomes = Array.isArray(state.incomes)
        ? state.incomes
        : [];

    currentMonth = ym(today());

    setupMobileNavigation();
    setupEvents();
    setupWelcome();
    setupSettingsOverlay();
    setupDynamicModal();
    setupChat();
    setupServiceWorker();

    save();
    render();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

})();