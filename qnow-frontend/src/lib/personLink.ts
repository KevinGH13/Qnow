import { useSearchParams } from 'react-router';

/** The person panel is driven by `?person=<id>` so it can open on top of any page. */
export function usePersonPanel() {
  const [params, setParams] = useSearchParams();
  const personId = params.get('person');

  const open = (id: string) =>
    setParams((p) => {
      p.set('person', id);
      return p;
    });

  const close = () =>
    setParams((p) => {
      p.delete('person');
      return p;
    });

  return { personId, open, close };
}
