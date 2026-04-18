import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Provider } from './provider.entity';

@Entity({ name: 'cities' })
export class City {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  name!: string;

  @OneToMany(() => Provider, (provider) => provider.city)
  providers!: Provider[];
}
