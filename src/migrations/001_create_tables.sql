create table categories (
    id serial primary key,
    name varchar(255) not null,
    slug varchar(255) not null unique
)

create table exams (
    id serial primary key,
    name varchar(255) not null,
    category_id int not null,
    foreign key (category_id) references categories(id) on delete cascade,
    slug varchar(255)
)

create table papers (
    id serial primary key,
    exam_id int not null,
    foreign key (exam_id) references exams(id) on delete cascade,
    year int not null,
    shift varchar(255),
    language varchar(255),
    s3_key varchar(500) not null,
    file_size int not null,
    download_count int default 0,
    uploaded_at timestamp default current_timestamp,
    slug varchar(255)
)