document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transaction-form');
    const transactionsList = document.getElementById('transactions-list');
    const balanceEl = document.getElementById('balance');
    const incomeTotalEl = document.getElementById('income-total');
    const expenseTotalEl = document.getElementById('expense-total');
    const filterTypeEl = document.getElementById('filter-type');
    const toast = document.getElementById('toast');
    
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    
    function updateTransactionsList() {
        const filterType = filterTypeEl.value;
        
        transactionsList.innerHTML = '';
        
        const filteredTransactions = filterType === 'all' 
            ? transactions 
            : transactions.filter(t => t.type === filterType);
        
        if (filteredTransactions.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Нет транзакций';
            emptyMessage.className = 'empty-message';
            transactionsList.appendChild(emptyMessage);
            return;
        }
        
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        filteredTransactions.forEach(transaction => {
            const item = document.createElement('li');
            item.className = `transaction-item ${transaction.type}`;
            
            item.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-name">${transaction.name}</div>
                    <div class="transaction-details">
                        <span class="transaction-category">${getCategoryName(transaction.category)}</span>
                        <span class="transaction-date">${formatDate(transaction.date)}</span>
                    </div>
                </div>
                <span class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}₽${parseFloat(transaction.amount).toFixed(2)}
                </span>
                <button class="transaction-delete" data-id="${transaction.id}">×</button>
            `;
            
            transactionsList.appendChild(item);
        });
        
        document.querySelectorAll('.transaction-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                deleteTransaction(id);
            });
        });
    }
    
    function getCategoryName(categoryValue) {
        const categories = {
            'salary': 'Зарплата',
            'food': 'Питание',
            'transport': 'Транспорт',
            'entertainment': 'Развлечения',
            'shopping': 'Покупки',
            'housing': 'Жилье',
            'utilities': 'Коммунальные услуги',
            'healthcare': 'Здоровье',
            'other': 'Другое'
        };
        
        return categories[categoryValue] || categoryValue;
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
    }
    
    function updateSummary() {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((total, t) => total + parseFloat(t.amount), 0);
        
        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((total, t) => total + parseFloat(t.amount), 0);
        
        const balance = income - expenses;
        
        balanceEl.textContent = `₽${balance.toFixed(2)}`;
        incomeTotalEl.textContent = `₽${income.toFixed(2)}`;
        expenseTotalEl.textContent = `₽${expenses.toFixed(2)}`;
        
        updateExpenseChart();
        
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }
    
    function updateExpenseChart() {
        const ctx = document.getElementById('expense-chart');
        
        if (window.expenseChart instanceof Chart) {
            window.expenseChart.destroy();
        }
        
        const expensesByCategory = {};
        
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                if (!expensesByCategory[t.category]) {
                    expensesByCategory[t.category] = 0;
                }
                expensesByCategory[t.category] += parseFloat(t.amount);
            });
        
        const labels = Object.keys(expensesByCategory).map(getCategoryName);
        const data = Object.values(expensesByCategory);
        
        if (data.length === 0) {
            ctx.innerHTML = '<p class="no-data">Нет данных для отображения графика</p>';
            return;
        }
        
        const backgroundColors = [
            '#ef4444', '#f97316', '#f59e0b', '#eab308', 
            '#84cc16', '#10b981', '#06b6d4', '#3b82f6', 
            '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'
        ];
        
        window.expenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors.slice(0, data.length),
                    borderWidth: 1,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 15,
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ₽${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    function addTransaction(transaction) {
        transactions.push({
            ...transaction,
            id: generateID()
        });
        
        updateSummary();
        updateTransactionsList();
        showToast('Транзакция сохранена');
    }
    
    function deleteTransaction(id) {
        transactions = transactions.filter(t => t.id !== id);
        updateSummary();
        updateTransactionsList();
        showToast('Транзакция удалена');
    }
    
    function generateID() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    transactionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('transaction-name').value;
        const amount = document.getElementById('transaction-amount').value;
        const type = document.getElementById('transaction-type').value;
        const category = document.getElementById('transaction-category').value;
        const date = document.getElementById('transaction-date').value || new Date().toISOString().split('T')[0];
        
        const transaction = {
            name,
            amount,
            type,
            category,
            date
        };
        
        addTransaction(transaction);
        this.reset();
        
        const dateInput = document.getElementById('transaction-date');
        if (!dateInput.value) {
            dateInput.valueAsDate = new Date();
        }
    });
    
    filterTypeEl.addEventListener('change', updateTransactionsList);
    
    const dateInput = document.getElementById('transaction-date');
    dateInput.valueAsDate = new Date();
    
    updateSummary();
    updateTransactionsList();
}); 