import AppError from '../errors/AppError';
import { getCustomRepository, Transaction } from 'typeorm';
import TransactionsRepository from "../repositories/TransactionsRepository";
import { isUuid } from 'uuidv4';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    if (!isUuid(id)) {
      throw new AppError("uuid invalid");
    }

    const transaction = await transactionsRepository.findOne(id);
    if(!transaction){
      throw new AppError("Transaction Not found");
    }
    await transactionsRepository.remove(transaction);
  }
}

export default DeleteTransactionService;
