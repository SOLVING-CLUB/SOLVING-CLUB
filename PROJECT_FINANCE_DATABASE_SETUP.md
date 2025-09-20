# Project Finance Database Setup

## Overview
This document provides complete instructions for setting up the database schema for the project finance management system in Supabase.

## 🗄️ Database Schema

### Tables Created

#### 1. **project_budgets**
Stores project budget information
```sql
- id (uuid, primary key)
- project_id (uuid, foreign key to projects)
- total_budget (decimal 15,2)
- currency (text, default 'INR')
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### 2. **budget_installments**
Stores payment installments for each budget
```sql
- id (uuid, primary key)
- budget_id (uuid, foreign key to project_budgets)
- amount (decimal 15,2)
- due_date (date)
- description (text)
- status (text: 'pending', 'paid', 'overdue')
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### 3. **client_payments**
Stores client payment records
```sql
- id (uuid, primary key)
- project_id (uuid, foreign key to projects)
- installment_id (uuid, foreign key to budget_installments, nullable)
- amount (decimal 15,2)
- payment_date (date)
- description (text)
- status (text: 'pending', 'verified', 'rejected')
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### 4. **payment_proof_files**
Stores proof of payment file metadata
```sql
- id (uuid, primary key)
- payment_id (uuid, foreign key to client_payments)
- file_name (text)
- file_path (text)
- file_size (bigint)
- file_type (text)
- uploaded_at (timestamptz)
```

## 🔧 Setup Instructions

### Step 1: Run Database Migration

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run Migration Script**
   - Copy the contents of `migrate-project-finance.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute the migration

3. **Verify Tables Created**
   - Check the Table Editor to confirm all tables are created
   - Verify the relationships and constraints are properly set

### Step 2: Storage Bucket Setup

The migration script automatically creates the `payment-proofs` storage bucket, but you may need to verify:

1. **Check Storage Bucket**
   - Go to Storage in Supabase Dashboard
   - Verify `payment-proofs` bucket exists
   - Check that it's set to private (not public)

2. **Verify Storage Policies**
   - The migration script sets up RLS policies for the storage bucket
   - Ensure authenticated users can upload/view files

### Step 3: Test the Setup

1. **Create a Test Project**
   - Create a new project in your application
   - Navigate to the Finance tab

2. **Set Up Budget**
   - Click "Set Budget"
   - Enter total budget and installments
   - Verify data is saved to database

3. **Record Payment**
   - Click "Record Payment"
   - Enter payment details and upload proof files
   - Verify payment and files are saved

## 🔐 Security Features

### Row Level Security (RLS)
All tables have RLS enabled with the following policies:

- **Project Owners**: Can view and manage all financial data for their projects
- **Project Members**: Can view financial data for projects they're members of
- **Unauthorized Users**: Cannot access any financial data

### File Storage Security
- **Private Bucket**: Payment proof files are stored in a private bucket
- **Authenticated Access**: Only authenticated users can upload/view files
- **Project-Based Access**: Users can only access files for projects they have access to

## 📊 Data Relationships

```
projects (1) ──→ (1) project_budgets
projects (1) ──→ (N) client_payments
project_budgets (1) ──→ (N) budget_installments
client_payments (1) ──→ (N) payment_proof_files
budget_installments (1) ──→ (N) client_payments
```

## 🚀 Performance Optimizations

### Indexes Created
- `project_budgets_project_id_idx` - Fast project budget lookups
- `budget_installments_budget_id_idx` - Fast installment queries
- `budget_installments_status_idx` - Fast status filtering
- `client_payments_project_id_idx` - Fast payment queries
- `client_payments_installment_id_idx` - Fast installment linking
- `client_payments_status_idx` - Fast payment status filtering
- `payment_proof_files_payment_id_idx` - Fast file lookups

## 🔄 Data Flow

### Budget Creation Flow
1. User creates budget with total amount and installments
2. Data saved to `project_budgets` table
3. Installments saved to `budget_installments` table
4. UI updates to show budget summary

### Payment Recording Flow
1. User records payment with amount and date
2. Payment saved to `client_payments` table
3. Files uploaded to Supabase Storage
4. File metadata saved to `payment_proof_files` table
5. Linked installment status updated to 'paid'
6. UI updates to show payment and remaining amount

## 🛠️ Troubleshooting

### Common Issues

#### 1. **Migration Fails**
- **Cause**: Missing dependencies or syntax errors
- **Solution**: Check that all required tables exist, run migration in parts

#### 2. **File Upload Fails**
- **Cause**: Storage bucket not created or policies not set
- **Solution**: Verify storage bucket exists and policies are correct

#### 3. **RLS Policy Errors**
- **Cause**: User doesn't have access to project
- **Solution**: Check user is project owner or member

#### 4. **Foreign Key Errors**
- **Cause**: Referenced records don't exist
- **Solution**: Ensure projects exist before creating budgets

### Debugging Queries

#### Check Budget Data
```sql
SELECT * FROM project_budgets WHERE project_id = 'your-project-id';
```

#### Check Installments
```sql
SELECT * FROM budget_installments WHERE budget_id = 'your-budget-id';
```

#### Check Payments
```sql
SELECT * FROM client_payments WHERE project_id = 'your-project-id';
```

#### Check Proof Files
```sql
SELECT * FROM payment_proof_files WHERE payment_id = 'your-payment-id';
```

## 📈 Monitoring

### Key Metrics to Monitor
- **Budget Utilization**: Track spending against budget
- **Payment Status**: Monitor pending vs verified payments
- **File Storage**: Monitor storage usage for proof files
- **User Activity**: Track budget and payment creation

### Useful Queries

#### Budget Summary
```sql
SELECT 
    pb.total_budget,
    pb.currency,
    COALESCE(SUM(cp.amount), 0) as total_paid,
    pb.total_budget - COALESCE(SUM(cp.amount), 0) as remaining
FROM project_budgets pb
LEFT JOIN client_payments cp ON pb.project_id = cp.project_id AND cp.status = 'verified'
WHERE pb.project_id = 'your-project-id'
GROUP BY pb.id, pb.total_budget, pb.currency;
```

#### Payment Status Summary
```sql
SELECT 
    status,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM client_payments 
WHERE project_id = 'your-project-id'
GROUP BY status;
```

## ✅ Verification Checklist

- [ ] All tables created successfully
- [ ] RLS policies applied correctly
- [ ] Storage bucket created and configured
- [ ] Indexes created for performance
- [ ] Test budget creation works
- [ ] Test payment recording works
- [ ] Test file upload works
- [ ] Test data loading works
- [ ] Verify security policies work
- [ ] Check performance with sample data

---

This database setup provides a robust foundation for the project finance management system with proper security, performance, and scalability considerations.
