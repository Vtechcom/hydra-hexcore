import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { Consumer } from './Consumer.entity';

@Entity()
export class ConsumerKeyMapper {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Consumer, consumer => consumer.id)
    @JoinColumn({ name: 'consumerId' })
    consumer: Consumer;

    @Column({
        unique: true,
    })
    consumerKey: string;

    @Column({
        default: '',
    })
    url: string;

    @Column({
        default: false,
    })
    isActive: boolean;
}
