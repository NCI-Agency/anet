package mil.dds.anet.utils;

import java.util.Collection;
import java.util.LinkedList;

/**
 * An extension of {@link LinkedList} that makes sure each element is unique (appearing only once in
 * the list), while preserving the insertion order. Specifically, if an element is added with
 * {@link #addFirst(Object)}, another copy of that element is removed from the list.
 *
 * @param <E> type of list element
 */
public class InsertionOrderLinkedList<E> extends LinkedList<E> {

  private static final long serialVersionUID = 1L;

  public InsertionOrderLinkedList() {
    super();
  }

  public InsertionOrderLinkedList(Collection<? extends E> c) {
    super(c);
  }

  @Override
  public void addFirst(E e) {
    remove(e);
    super.addFirst(e);
  }

}
