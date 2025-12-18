import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { HydraNode } from '../../hydra-main/entities/HydraNode.entity';
import { ProtocolParameter } from '../interfaces/protocol-parameter.key';

@Entity()
export class HydraHead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    nullable: true,
  })
  description: string;

  @Column({
    default: 1,
  })
  nodes: number;

  @Column({
    default: '120'
  })
  contestationPeriod: string;

  @Column({
    default: '720',
  })
  depositPeriod: string;

  @Column({
    default: '15000',
  })
  persistenceRotateAfter: string;

  @Column({
    type: 'json',
    nullable: true,
  })
  protocolParameters: ProtocolParameter;

  @Column({
    type: 'enum',
    default: 'configured',
    enum: ['configured', 'running', 'stop'],
  })
  status: 'configured' | 'running' | 'stop';

  @Column({
    default: new Date().toISOString(),
  })
  createdAt: string;

  @OneToMany(() => HydraNode, (hydraNode) => hydraNode.hydraHead)
  hydraNodes: HydraNode[];
}
