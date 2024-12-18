import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class HydraNode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  port: number;
}
