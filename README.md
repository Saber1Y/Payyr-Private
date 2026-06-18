# Payyr Private: Confidential Stablecoin Payroll for Global Teams

Privacy-preserving stablecoin payroll system on Canton for companies, contractors, and auditors. **Employers can run payroll, employees can privately view their own payments, and auditors can verify payroll records — without exposing salaries, wallet addresses, or payroll batches to the public.**

## 🔐 Privacy-First Features

- **Confidential Salary Records**: Only employers and employees can see salary information
- **Private Payroll Batches**: Payroll executions are selectively visible based on roles
- **Employee-Only Payment Portal**: Employees see only their own payment information
- **Auditor Access Control**: Employers can grant auditors access to verify payroll without public exposure
- **Role-Based Visibility**: EMPLOYER, EMPLOYEE, AUDITOR, and ADMIN roles with strict permission boundaries
- **Multi-Tenant Architecture**: Unlimited companies share the same smart contracts with isolated, private operations
- **Stablecoin Integration**: USDC payments on Arc Network with confidential transaction semantics
- **Institutional Compliance**: Prove payroll execution to auditors without exposing sensitive employee data

## 🔄 How It Works

### For Employers (Self-Service Flow)

```
1. Connect Wallet
   → Your wallet address is your identity

2. Register as Employer
   → Click "Register as Employer" button
   → Calls registerAsEmployer() contract function
   → Automatically granted HR_ROLE
   → Cost: ~$0.08 in gas

3. Add Your Employees
   → Go to Employees page
   → Click "Add Employee"
   → Enter: Name, Wallet Address, Salary, Role
   → Employee linked to your employer address
   → Only YOU can manage your employees
   → Cost: ~$0.19 per employee

4. Deposit USDC for Payroll
   → Go to Payroll page
   → Approve USDC spending (one-time)
   → Deposit desired amount
   → Funds tracked in your employer balance
   → Cost: ~$0.17 (approve + deposit)

5. Execute Payroll
   → Click "Pay All Employees"
   → Contract pays only YOUR employees
   → Deducts from your employer balance
   → Instant USDC transfers to employee wallets
   → Cost: ~$0.24 per employee
```

### Multi-Tenant Isolation

All employers share the same contracts but operate independently:

```solidity
// Each employer has their own balance
employerBalances[companyA] = 10_000 USDC
employerBalances[companyB] = 5_000 USDC

// Each employer manages only their employees
getEmployerEmployees(companyA) → [emp1, emp2, emp3]
getEmployerEmployees(companyB) → [emp4, emp5]

// Payroll is isolated
companyA.executePayroll() → pays emp1, emp2, emp3
companyB.executePayroll() → pays emp4, emp5
```

## 🏗️ Architecture

### Smart Contracts

**EmployeeRegistry** (`0x20B3dB45a351E92673112064A3F01951115eD6B7`)
- Manages employee records
- Links employees to employers
- Handles employer registration
- Tracks employer-employee relationships

**PayrollManager** (`0x1739715A3452BF1e336305cf8f9542d177cEa03A`)
- Manages USDC deposits
- Executes payroll per employer
- Tracks employer balances
- Handles payroll history

### Frontend Application

```
frontend/
├── app/
│   ├── dashboard/    # Platform overview & statistics
│   ├── employees/    # Employee management with employer registration
│   ├── payroll/      # USDC deposits & payroll execution
│   └── settings/    # User preferences
├── components/
│   ├── ui/          # shadcn/ui components
│   └── providers/  # Wallet & context providers
└── lib/
    └── abi/         # Smart contract ABIs
```

## 💰 Gas Costs

### Deployment (Platform Owner - One-Time)

| Contract | Est. Gas | Cost (USDC) |
|----------|----------|-------------|
| EmployeeRegistry | ~1.5M | **$2.40** |
| PayrollManager | ~2.6M | **$4.16** |
| **Total Deployment** | **~4.1M** | **$6.56** |

### User Operations

| Operation | Est. Gas | Cost (USDC) |
|-----------|----------|-------------|
| Register as Employer | 50,000 | **$0.08** |
| Add Employee | 120,000 | **$0.19** |
| Update Employee | 90,000 | **$0.14** |
| Deactivate Employee | 80,000 | **$0.13** |
| Approve USDC (once) | 40,000 | **$0.06** |
| Deposit Payroll | 70,000 | **$0.11** |
| Execute Payroll (per employee) | 150,000 | **$0.24** |

*Assumptions: 160 gwei gas price, $0.0016 per gas unit on Arc Network*

### Cost Example: Company with 5 Employees

- Register as employer: **$0.08**
- Add 5 employees: **$0.95**
- Approve USDC (one-time): **$0.06**
- Deposit $10,000: **$0.11**
- Execute payroll (5 employees): **$1.20**
- **Total: $2.40 per payroll run**

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Foundry installed (for smart contract development)
- Wallet with Arc Network USDC

### Backend (Smart Contracts)

```bash
cd Backend
forge install
forge build
forge test

# Deploy to Arc Network
forge script script/DeployDirect.s.sol --rpc-url $RPC_URL --broadcast
```

### Frontend (Web Application)

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Quick Start for New Users

1. **Connect your wallet** - Click the connect button in the top right
2. **Register as employer** - Go to Employees page and click "Register as Employer"
3. **Add your team** - Add employees with their wallet addresses and salaries
4. **Fund your payroll** - Go to Payroll page and deposit USDC
5. **Pay your team** - Click "Pay All Employees" to execute payroll

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with app router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first styling
- **shadcn/ui** - Modern component library
- **Privy** - Embedded wallet authentication
- **Wagmi** - React hooks for Ethereum
- **Lucide React** - Beautiful icons

### Backend
- **Foundry** - Smart contract development framework
- **Solidity** - Smart contract programming language
- **OpenZeppelin** - Security libraries (AccessControl, ReentrancyGuard, Pausable)
- **Arc Network** - Layer 2 blockchain for fast, cheap transactions

## 📊 Pages & Features

### Dashboard
- Platform-wide statistics
- Recent payroll runs
- Total contract balance (admin view)

### Employees
- **Employer Registration** - Self-service onboarding
- **Employee List** - View your team members
- **Add Employee** - Add new team members
- **Edit Employee** - Update employee details
- **Activate/Deactivate** - Manage employee status

### Payroll
- **Deposit USDC** - Fund your payroll account
- **View Balance** - Check your available funds
- **Execute Payroll** - Pay all active employees
- **Payroll History** - View past runs

### Settings
- Company information
- Payment preferences
- Wallet management

## 🔐 Security Features

- **Wallet-based authentication** - Secure login via Privy
- **Role-based access control** - Employers only manage their employees
- **Isolated employer balances** - Funds separated per employer
- **ReentrancyGuard** - Prevent reentrancy attacks
- **Pausable** - Emergency pause functionality
- **Audit-ready code** - Clean, well-documented contracts

## 🎯 Why This Is Great for Arc Rewards

1. **Multi-Tenant Design** - Scalable to unlimited companies
2. **Self-Service** - No manual onboarding required
3. **Gas Efficient** - Shared contracts = lower costs for users
4. **Real Utility** - Actual payroll management use case
5. **Production Ready** - Complete frontend + backend
6. **Low Barrier** - $0.08 to become an employer

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support and questions, please open an issue in this repository.
