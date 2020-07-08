import { EntityRepository, Repository } from 'typeorm';

import Category from '../models/Category';


@EntityRepository(Category)
class CategorysRepository extends Repository<Category> {

}

export default CategorysRepository;
