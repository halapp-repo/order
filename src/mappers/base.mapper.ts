export abstract class IMapper<TModal, TDto> {
  abstract toDTO(arg: TModal, ...params: unknown[]): TDto;
  toListDTO(arg: TModal[], ...params: unknown[]): TDto[] {
    return arg.map((a) => this.toDTO(a, ...params));
  }
  abstract toModel(arg: TDto, ...params: unknown[]): TModal;
  toListModel(arg: TDto[], ...params: unknown[]): TModal[] {
    return arg.map((a) => this.toModel(a, ...params));
  }
}
