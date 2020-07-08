import { getCustomRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CategoryRepository from '../repositories/CategoryRepository';
import parse from 'csv-parse';
import CategorysRepository from '../repositories/CategoryRepository';
import Category from '../models/Category';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getCustomRepository(CategorysRepository);

    const transactionStream = fs.createReadStream(filePath);
    const parser = csvParse({
      from_line: 2,
    });

    const parseCSV = transactionStream.pipe(parser);
    const transactions: CSVTransaction[] = []
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) => cell.trim());
      if (!title || !type || !value) return;
      if (!['income', 'outcome'].includes(type)) return;
      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));
    const existsCategories = await categoriesRepository.find({ where: { title: In(categories) } });

    const existsCategoriesTitles = existsCategories.map((category: Category) => category.title);

    const addCategoriesTitles = categories
      .filter(category => !existsCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const createdCategories = await categoriesRepository.create(
      addCategoriesTitles.map((title) => ({
        title,
    })));
    const savedCategories = await categoriesRepository.save(createdCategories);
    const allCategories = [...existsCategories, ...savedCategories];

    const createdTransactions = await transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(category => category.title === transaction.category),
    })));
    await transactionsRepository.save(createdTransactions);
    await fs.promises.unlink(filePath);
    return createdTransactions;
  }
}

export default ImportTransactionsService;
