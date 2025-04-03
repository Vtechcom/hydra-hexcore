import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class ConsumerKeyMapper {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        unique: true,
    })
    consumerKey: string;

    @Column({
        default: '',
    })
    url: string;
}
