import AppError from '../errors/AppError';
import { getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionsRepository from "../repositories/TransactionsRepository";
import CategoryRepository from "../repositories/CategoryRepository";

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  categoryTitle: string;
}

class CreateTransactionService {
  public async execute({ title, value, type, categoryTitle }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getCustomRepository(CategoryRepository);
    if (!['income', 'outcome'].includes(type)) {
      throw new AppError("only types are accepted [income, outcome]");
    }
    if (!categoryTitle) {
      throw new AppError("Category invalid.");
    }

    const { total } = await transactionsRepository.getBalance();
    if (type === 'outcome' && total < value) {
      throw new AppError("You do not have enough balance");
    }
    let category = await categoriesRepository.findOne({ where: { title: categoryTitle } });
    if (!category) {
      category = categoriesRepository.create({
        title: categoryTitle,
      });
      await categoriesRepository.save(category);
    }
    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: category,
    });
    await transactionsRepository.save(transaction);
    return transaction;

  }
}

export default CreateTransactionService;
