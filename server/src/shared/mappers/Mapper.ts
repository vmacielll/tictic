export interface Mapper<TDomain, TPrisma> {
  toDomain(prisma: TPrisma): TDomain
  toPrisma(domain: TDomain): TPrisma
}
