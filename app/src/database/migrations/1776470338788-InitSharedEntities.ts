import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSharedEntities1776470338788 implements MigrationInterface {
  name = 'InitSharedEntities1776470338788';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "message_types" ("id" SERIAL NOT NULL, "name" character varying(50) NOT NULL, CONSTRAINT "UQ_0e84b3154cd312804805a979012" UNIQUE ("name"), CONSTRAINT "PK_02e2c1c89664b1f5961b136aff5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "favorites" ("id" SERIAL NOT NULL, "tenant_id" integer NOT NULL, "client_user_id" integer NOT NULL, "provider_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "favorites_client_provider_uniq" UNIQUE ("client_user_id", "tenant_id", "provider_id"), CONSTRAINT "favorites_id_tenant_uniq" UNIQUE ("id", "tenant_id"), CONSTRAINT "PK_890818d27523748dd36a4d1bdc8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "reviews" ("id" SERIAL NOT NULL, "tenant_id" integer NOT NULL, "booking_id" integer NOT NULL, "client_user_id" integer NOT NULL, "provider_id" integer NOT NULL, "rating" integer NOT NULL, "comment" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_bbd6ac6e3e6a8f8c6e0e8692d63" UNIQUE ("booking_id"), CONSTRAINT "reviews_id_tenant_uniq" UNIQUE ("id", "tenant_id"), CONSTRAINT "REL_8be2c4a9eeaa2bddbb69888d0b" UNIQUE ("booking_id", "tenant_id"), CONSTRAINT "CHK_2ea381a5c2f8bef0073a48f6bd" CHECK ("rating" BETWEEN 1 AND 5), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" SERIAL NOT NULL, "name" character varying(50) NOT NULL, CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "role_id" integer NOT NULL, "full_name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "phone" character varying(50), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "messages" ("id" SERIAL NOT NULL, "tenant_id" integer NOT NULL, "conversation_id" integer NOT NULL, "sender_user_id" integer NOT NULL, "message_type_id" integer NOT NULL, "content" text NOT NULL, "sent_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "messages_id_tenant_uniq" UNIQUE ("id", "tenant_id"), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "conversations" ("id" SERIAL NOT NULL, "tenant_id" integer NOT NULL, "client_user_id" integer NOT NULL, "provider_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "conversations_unique_pair" UNIQUE ("tenant_id", "client_user_id", "provider_id"), CONSTRAINT "conversations_id_tenant_uniq" UNIQUE ("id", "tenant_id"), CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "provider_company_details" ("id" SERIAL NOT NULL, "tenant_id" integer NOT NULL, "provider_id" integer NOT NULL, "business_name" character varying(255) NOT NULL, "business_number" character varying(100), "website" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fb011c7d478574d4e978d56cf2f" UNIQUE ("provider_id"), CONSTRAINT "provider_company_details_id_tenant_uniq" UNIQUE ("id", "tenant_id"), CONSTRAINT "REL_7d8b49eb8b10d7ba69f1bc59f2" UNIQUE ("provider_id", "tenant_id"), CONSTRAINT "PK_cfcdbe3bbc89813633250915334" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "provider_documents" ("id" SERIAL NOT NULL, "tenant_id" integer NOT NULL, "provider_id" integer NOT NULL, "document_type" character varying(100) NOT NULL, "file_url" text NOT NULL, "is_verified" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "provider_documents_id_tenant_uniq" UNIQUE ("id", "tenant_id"), CONSTRAINT "PK_bc3bb226a18aa1bbae0baa7df15" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "provider_individual_details" ("id" SERIAL NOT NULL, "tenant_id" integer NOT NULL, "provider_id" integer NOT NULL, "profession_title" character varying(255) NOT NULL, "years_of_experience" integer, "bio" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_dba3f939629a6c95fef49a9c57d" UNIQUE ("provider_id"), CONSTRAINT "provider_individual_details_id_tenant_uniq" UNIQUE ("id", "tenant_id"), CONSTRAINT "REL_d2818d6e831488ff00ac30522f" UNIQUE ("provider_id", "tenant_id"), CONSTRAINT "PK_4443677ac6837e093fd68bb242d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "description" text, CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "service_images" ("id" SERIAL NOT NULL, "tenant_id" integer NOT NULL, "service_id" integer NOT NULL, "image_url" text NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "service_images_id_tenant_uniq" UNIQUE ("id", "tenant_id"), CONSTRAINT "PK_d99f2c54bf48af54e7952abe0c0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "service_tags" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, CONSTRAINT "UQ_bfcc0ea761122a0c8f85c6561aa" UNIQUE ("name"), CONSTRAINT "PK_861921291b11de4dac6adea29a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "service_tag_map" ("id" SERIAL NOT NULL, "tenant_id" integer NOT NULL, "service_id" integer NOT NULL, "tag_id" integer NOT NULL, CONSTRAINT "service_tag_map_service_tag_uniq" UNIQUE ("tenant_id", "service_id", "tag_id"), CONSTRAINT "service_tag_map_id_tenant_uniq" UNIQUE ("id", "tenant_id"), CONSTRAINT "PK_23ae3d11d9efcf813029073f392" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "services" ("id" SERIAL NOT NULL, "tenant_id" integer NOT NULL, "provider_id" integer NOT NULL, "category_id" integer NOT NULL, "title" character varying(255) NOT NULL, "description" text, "base_price" numeric(10,2) NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "services_id_tenant_uniq" UNIQUE ("id", "tenant_id"), CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tenants" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_32731f181236a46182a38c992a8" UNIQUE ("name"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "booking_status_history" ("id" SERIAL NOT NULL, "tenant_id" integer NOT NULL, "booking_id" integer NOT NULL, "old_status_id" integer, "new_status_id" integer NOT NULL, "changed_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "booking_status_history_id_tenant_uniq" UNIQUE ("id", "tenant_id"), CONSTRAINT "PK_589851c586ac15a59462092c0cd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "booking_statuses" ("id" SERIAL NOT NULL, "name" character varying(50) NOT NULL, CONSTRAINT "UQ_88c8601b3e2c3515817d957656d" UNIQUE ("name"), CONSTRAINT "PK_629d32d3e930c51b11b1ee24b5f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "bookings" ("id" SERIAL NOT NULL, "tenant_id" integer NOT NULL, "client_user_id" integer NOT NULL, "provider_id" integer NOT NULL, "service_id" integer NOT NULL, "status_id" integer NOT NULL, "booking_date" TIMESTAMP NOT NULL, "total_price" numeric(10,2) NOT NULL DEFAULT '0', "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "bookings_id_tenant_uniq" UNIQUE ("id", "tenant_id"), CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "cities" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, CONSTRAINT "UQ_a0ae8d83b7d32359578c486e7f6" UNIQUE ("name"), CONSTRAINT "PK_4762ffb6e5d198cfec5606bc11e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "providers" ("id" SERIAL NOT NULL, "tenant_id" integer NOT NULL, "owner_user_id" integer NOT NULL, "type" character varying(20) NOT NULL, "display_name" character varying(255) NOT NULL, "description" text, "city_id" integer, "address" text, "is_verified" boolean NOT NULL DEFAULT false, "average_rating" numeric(3,2), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1bb0cb5f05f1d799c71f4458d23" UNIQUE ("owner_user_id"), CONSTRAINT "providers_id_tenant_uniq" UNIQUE ("id", "tenant_id"), CONSTRAINT "REL_1bb0cb5f05f1d799c71f4458d2" UNIQUE ("owner_user_id"), CONSTRAINT "CHK_ce8ebdf62ed7f62c790e0b1996" CHECK ("type" IN ('company', 'individual')), CONSTRAINT "PK_af13fc2ebf382fe0dad2e4793aa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "availability_slots" ("id" SERIAL NOT NULL, "tenant_id" integer NOT NULL, "provider_id" integer NOT NULL, "start_time" TIMESTAMP NOT NULL, "end_time" TIMESTAMP NOT NULL, "is_booked" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "availability_slots_id_tenant_uniq" UNIQUE ("id", "tenant_id"), CONSTRAINT "PK_70765e8e17c8f6374060d70589a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" ADD CONSTRAINT "FK_4ee9e8336d9538f0fd4a39392be" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" ADD CONSTRAINT "FK_4e39da9fbe8407c0942e331804f" FOREIGN KEY ("client_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" ADD CONSTRAINT "FK_e460cb5c2d12a0e37fef9983336" FOREIGN KEY ("provider_id", "tenant_id") REFERENCES "providers"("id","tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_bfb7f35d7db2b7afc40811c1925" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_8be2c4a9eeaa2bddbb69888d0b3" FOREIGN KEY ("booking_id", "tenant_id") REFERENCES "bookings"("id","tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_2642bd6066a7aceaa963d3a4ac7" FOREIGN KEY ("client_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_aacdfc781baaadebe8f4bfc6f63" FOREIGN KEY ("provider_id", "tenant_id") REFERENCES "providers"("id","tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_558150f45586066db2415eb28c5" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_02b2b8e1e9b7d58f24b96107e5c" FOREIGN KEY ("conversation_id", "tenant_id") REFERENCES "conversations"("id","tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_b183972e0b84c9022884433195e" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_bddc671662390b17a2df6815075" FOREIGN KEY ("message_type_id") REFERENCES "message_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_664e8d7cbdae35df5cae341352a" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_3dd47137094bd1917a82b9e3901" FOREIGN KEY ("client_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_b3dd94071abb5a8d74b75c3ab52" FOREIGN KEY ("provider_id", "tenant_id") REFERENCES "providers"("id","tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_company_details" ADD CONSTRAINT "FK_fae5b45d70bfe0c84ecc771e810" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_company_details" ADD CONSTRAINT "FK_7d8b49eb8b10d7ba69f1bc59f2d" FOREIGN KEY ("provider_id", "tenant_id") REFERENCES "providers"("id","tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_documents" ADD CONSTRAINT "FK_d0f5a501e59f9d6ac9cda43ef9b" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_documents" ADD CONSTRAINT "FK_0cf388ad99d38c321110788bec1" FOREIGN KEY ("provider_id", "tenant_id") REFERENCES "providers"("id","tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_individual_details" ADD CONSTRAINT "FK_13252e63fb753ef4ccc277302eb" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_individual_details" ADD CONSTRAINT "FK_d2818d6e831488ff00ac30522f1" FOREIGN KEY ("provider_id", "tenant_id") REFERENCES "providers"("id","tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_images" ADD CONSTRAINT "FK_fa9bbcf6563b8528b62e0e02d21" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_images" ADD CONSTRAINT "FK_9f81a808e46f271afec934cd634" FOREIGN KEY ("service_id", "tenant_id") REFERENCES "services"("id","tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_tag_map" ADD CONSTRAINT "FK_d36588cd41acdc08566f2a20298" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_tag_map" ADD CONSTRAINT "FK_714496ad83c6afe2bd70eabe22a" FOREIGN KEY ("service_id", "tenant_id") REFERENCES "services"("id","tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_tag_map" ADD CONSTRAINT "FK_2581f2b6b52a8f7d44956c30577" FOREIGN KEY ("tag_id") REFERENCES "service_tags"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "FK_847c3b57ab049376d3380329a9c" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "FK_c5c682f4ea9f6063621a12b2d3f" FOREIGN KEY ("provider_id", "tenant_id") REFERENCES "providers"("id","tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "FK_1f8d1173481678a035b4a81a4ec" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_status_history" ADD CONSTRAINT "FK_dfe8effa707ea36ffe844b578c2" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_status_history" ADD CONSTRAINT "FK_0aa76e512fc0919496f35995324" FOREIGN KEY ("booking_id", "tenant_id") REFERENCES "bookings"("id","tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_status_history" ADD CONSTRAINT "FK_71f342c76aa3a0a3e09c97012b1" FOREIGN KEY ("old_status_id") REFERENCES "booking_statuses"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_status_history" ADD CONSTRAINT "FK_1cebe3aa7880b1bf72eb37ef930" FOREIGN KEY ("new_status_id") REFERENCES "booking_statuses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_0c41823fa6a879a6aeba1774657" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_1dfc890dafd0b25472778798b5c" FOREIGN KEY ("client_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_2d39a6504d1efbd2aa7fb7fe50d" FOREIGN KEY ("provider_id", "tenant_id") REFERENCES "providers"("id","tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_bd3116c18fc3018849e83026fba" FOREIGN KEY ("service_id", "tenant_id") REFERENCES "services"("id","tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_ef1dc8c40fd16481ba1f2f59c2e" FOREIGN KEY ("status_id") REFERENCES "booking_statuses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "providers" ADD CONSTRAINT "FK_00fe8f8b5aa1c40e7460fdfefe6" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "providers" ADD CONSTRAINT "FK_1bb0cb5f05f1d799c71f4458d23" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "providers" ADD CONSTRAINT "FK_726fa1ee3880b4841bfcfa4935f" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability_slots" ADD CONSTRAINT "FK_f5af92f9ebc9b5a4fe5af0c226d" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability_slots" ADD CONSTRAINT "FK_5b7ad3a3c714e1e095859096598" FOREIGN KEY ("provider_id", "tenant_id") REFERENCES "providers"("id","tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "availability_slots" DROP CONSTRAINT "FK_5b7ad3a3c714e1e095859096598"`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability_slots" DROP CONSTRAINT "FK_f5af92f9ebc9b5a4fe5af0c226d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "providers" DROP CONSTRAINT "FK_726fa1ee3880b4841bfcfa4935f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "providers" DROP CONSTRAINT "FK_1bb0cb5f05f1d799c71f4458d23"`,
    );
    await queryRunner.query(
      `ALTER TABLE "providers" DROP CONSTRAINT "FK_00fe8f8b5aa1c40e7460fdfefe6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_ef1dc8c40fd16481ba1f2f59c2e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_bd3116c18fc3018849e83026fba"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_2d39a6504d1efbd2aa7fb7fe50d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_1dfc890dafd0b25472778798b5c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_0c41823fa6a879a6aeba1774657"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_status_history" DROP CONSTRAINT "FK_1cebe3aa7880b1bf72eb37ef930"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_status_history" DROP CONSTRAINT "FK_71f342c76aa3a0a3e09c97012b1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_status_history" DROP CONSTRAINT "FK_0aa76e512fc0919496f35995324"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_status_history" DROP CONSTRAINT "FK_dfe8effa707ea36ffe844b578c2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "FK_1f8d1173481678a035b4a81a4ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "FK_c5c682f4ea9f6063621a12b2d3f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "FK_847c3b57ab049376d3380329a9c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_tag_map" DROP CONSTRAINT "FK_2581f2b6b52a8f7d44956c30577"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_tag_map" DROP CONSTRAINT "FK_714496ad83c6afe2bd70eabe22a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_tag_map" DROP CONSTRAINT "FK_d36588cd41acdc08566f2a20298"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_images" DROP CONSTRAINT "FK_9f81a808e46f271afec934cd634"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_images" DROP CONSTRAINT "FK_fa9bbcf6563b8528b62e0e02d21"`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_individual_details" DROP CONSTRAINT "FK_d2818d6e831488ff00ac30522f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_individual_details" DROP CONSTRAINT "FK_13252e63fb753ef4ccc277302eb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_documents" DROP CONSTRAINT "FK_0cf388ad99d38c321110788bec1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_documents" DROP CONSTRAINT "FK_d0f5a501e59f9d6ac9cda43ef9b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_company_details" DROP CONSTRAINT "FK_7d8b49eb8b10d7ba69f1bc59f2d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider_company_details" DROP CONSTRAINT "FK_fae5b45d70bfe0c84ecc771e810"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_b3dd94071abb5a8d74b75c3ab52"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_3dd47137094bd1917a82b9e3901"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_664e8d7cbdae35df5cae341352a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_bddc671662390b17a2df6815075"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_b183972e0b84c9022884433195e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_02b2b8e1e9b7d58f24b96107e5c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_558150f45586066db2415eb28c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_aacdfc781baaadebe8f4bfc6f63"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_2642bd6066a7aceaa963d3a4ac7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_8be2c4a9eeaa2bddbb69888d0b3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_bfb7f35d7db2b7afc40811c1925"`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" DROP CONSTRAINT "FK_e460cb5c2d12a0e37fef9983336"`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" DROP CONSTRAINT "FK_4e39da9fbe8407c0942e331804f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorites" DROP CONSTRAINT "FK_4ee9e8336d9538f0fd4a39392be"`,
    );
    await queryRunner.query(`DROP TABLE "availability_slots"`);
    await queryRunner.query(`DROP TABLE "providers"`);
    await queryRunner.query(`DROP TABLE "cities"`);
    await queryRunner.query(`DROP TABLE "bookings"`);
    await queryRunner.query(`DROP TABLE "booking_statuses"`);
    await queryRunner.query(`DROP TABLE "booking_status_history"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
    await queryRunner.query(`DROP TABLE "services"`);
    await queryRunner.query(`DROP TABLE "service_tag_map"`);
    await queryRunner.query(`DROP TABLE "service_tags"`);
    await queryRunner.query(`DROP TABLE "service_images"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "provider_individual_details"`);
    await queryRunner.query(`DROP TABLE "provider_documents"`);
    await queryRunner.query(`DROP TABLE "provider_company_details"`);
    await queryRunner.query(`DROP TABLE "conversations"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "reviews"`);
    await queryRunner.query(`DROP TABLE "favorites"`);
    await queryRunner.query(`DROP TABLE "message_types"`);
  }
}
