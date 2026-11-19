/** Representação de tipos C usada pelo parser e pelo interpretador. */

export type NumName = 'int' | 'char' | 'long' | 'short' | 'unsigned' | 'size_t' | 'double' | 'float';

export type CType =
  | { k: 'num'; name: NumName; alias?: string }
  | { k: 'void'; alias?: string }
  | { k: 'ptr'; to: CType; alias?: string }
  | { k: 'struct'; name: string; alias?: string }
  | { k: 'fn'; ret: CType; params: CType[]; alias?: string };

export interface FieldDef {
  name: string;
  type: CType;
}

export interface StructDef {
  name: string;
  /** null = tipo incompleto (declarado mas ainda sem campos). */
  fields: FieldDef[] | null;
}

export class TypeEnv {
  typedefs = new Map<string, CType>();
  structs = new Map<string, StructDef>();

  clone(): TypeEnv {
    const t = new TypeEnv();
    this.typedefs.forEach((v, k) => t.typedefs.set(k, v));
    this.structs.forEach((v, k) => t.structs.set(k, { name: v.name, fields: v.fields ? [...v.fields] : null }));
    return t;
  }

  declareStruct(name: string) {
    if (!this.structs.has(name)) this.structs.set(name, { name, fields: null });
  }

  defineStruct(name: string, fields: FieldDef[]) {
    this.structs.set(name, { name, fields });
  }

  fields(name: string): FieldDef[] | null {
    return this.structs.get(name)?.fields ?? null;
  }
}

export const T_INT: CType = { k: 'num', name: 'int' };
export const T_SIZE: CType = { k: 'num', name: 'size_t' };
export const T_VOID: CType = { k: 'void' };
export const T_VOIDPTR: CType = { k: 'ptr', to: T_VOID };
export const T_CHARPTR: CType = { k: 'ptr', to: { k: 'num', name: 'char' } };

export function typeToString(t: CType): string {
  if (t.alias) return t.alias;
  switch (t.k) {
    case 'num':
      return t.name;
    case 'void':
      return 'void';
    case 'struct':
      return `struct ${t.name}`;
    case 'ptr':
      return t.to.k === 'fn' ? `${typeToString(t.to.ret)} (*)(...)` : `${typeToString(t.to)}*`;
    case 'fn':
      return `${typeToString(t.ret)} (${t.params.map(typeToString).join(', ')})`;
  }
}

/** Descreve o tipo "expandido", sem typedef, ex.: upo_list_t -> struct upo_list_s*. */
export function expandedTypeString(t: CType): string {
  switch (t.k) {
    case 'num':
      return t.name;
    case 'void':
      return 'void';
    case 'struct':
      return `struct ${t.name}`;
    case 'ptr':
      return `${expandedTypeString(t.to)}*`;
    case 'fn':
      return `${expandedTypeString(t.ret)} (${t.params.map(expandedTypeString).join(', ')})`;
  }
}

export function isFloat(t: CType): boolean {
  return t.k === 'num' && (t.name === 'double' || t.name === 'float');
}

/** Compatibilidade estrutural (ignora typedef e const). */
export function sameType(a: CType, b: CType): boolean {
  if (a.k !== b.k) return false;
  switch (a.k) {
    case 'num':
      return true; // conversões numéricas são implícitas em C
    case 'void':
      return true;
    case 'struct':
      return a.name === (b as { name: string }).name;
    case 'ptr':
      return sameType(a.to, (b as { to: CType }).to);
    case 'fn': {
      const bf = b as { ret: CType; params: CType[] };
      return sameType(a.ret, bf.ret) && a.params.length === bf.params.length && a.params.every((p, i) => sameType(p, bf.params[i]));
    }
  }
}

/** Ponteiros compatíveis para atribuição: iguais, ou um deles é void*. */
export function pointerAssignable(target: CType, source: CType): boolean {
  if (target.k !== 'ptr' || source.k !== 'ptr') return false;
  if (target.to.k === 'void' || source.to.k === 'void') return true;
  return sameType(target.to, source.to);
}

export function nominalSize(t: CType, env: TypeEnv): number {
  switch (t.k) {
    case 'num':
      return t.name === 'char' ? 1 : t.name === 'size_t' || t.name === 'long' || t.name === 'double' ? 8 : 4;
    case 'ptr':
      return 8;
    case 'void':
      return 1;
    case 'fn':
      return 8;
    case 'struct': {
      const f = env.fields(t.name);
      return f ? f.reduce((s, x) => s + nominalSize(x.type, env), 0) : 0;
    }
  }
}
