import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ServiceTagMap } from './service-tag-map.entity';

@Entity({ name: 'service_tags' })
export class ServiceTag {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @OneToMany(() => ServiceTagMap, (serviceTagMap) => serviceTagMap.tag)
  serviceTagMaps!: ServiceTagMap[];
}
