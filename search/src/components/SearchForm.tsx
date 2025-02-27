import { BiRegularSearch, BiRegularX } from "solid-icons/bi";
import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import {
  Combobox,
  ComboboxItem,
  ComboboxSection,
} from "./Atoms/ComboboxChecklist";
import {
  Menu,
  MenuItem,
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "solid-headless";
import { FaSolidCheck } from "solid-icons/fa";
import type { Filters } from "./ResultsPage";

const parseEnvComboboxItems = (data: string | undefined): ComboboxItem[] => {
  const names = data?.split(",");
  if (!names) return [];
  return names
    .filter((name) => name && name !== "")
    .map((name) => {
      return {
        name: name,
      };
    });
};

const SearchForm = (props: {
  query?: string;
  filters: Filters;
  searchType: string;
  collectionID?: string;
}) => {
  const tagSetItems = parseEnvComboboxItems(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    import.meta.env.PUBLIC_TAG_SET_ITEMS,
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const linksItems = parseEnvComboboxItems(import.meta.env.PUBLIC_LINK_ITEMS);
  const createEvidenceFeature =
    import.meta.env.PUBLIC_CREATE_EVIDENCE_FEATURE !== "off";
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const feelingSuffixes: string[] = (
    import.meta.env.PUBLIC_LUCKY_ITEMS || "Happy,Sad,Excited,Who the hell knows"
  ).split(",");

  const filterDataTypeComboboxSections: ComboboxSection[] = [
    {
      name: "Tag Set",
      comboboxItems: tagSetItems,
    },
  ];
  const filterLinkComboboxSections: ComboboxSection[] = [
    {
      name: "Links",
      comboboxItems: linksItems,
    },
  ];

  const [searchTypes, setSearchTypes] = createSignal([
    { name: "Full Text", isSelected: false, route: "fulltextsearch" },
    { name: "Semantic", isSelected: true, route: "search" },
  ]);
  // eslint-disable-next-line solid/reactivity
  const [textareaInput, setTextareaInput] = createSignal(props.query ?? "");
  const [typewriterEffect, setTypewriterEffect] = createSignal("");
  const [textareaFocused, setTextareaFocused] = createSignal(false);

  const [filterDataTypes, setFilterDataTypes] = createSignal<ComboboxSection[]>(
    filterDataTypeComboboxSections,
  );

  const [filterLinks, setFilterLinks] = createSignal<ComboboxSection[]>(
    filterLinkComboboxSections,
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const customDataTypeFilters = JSON.parse(
    localStorage.getItem("customDatasetFilters") ?? "[]",
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const customLinkFilters = JSON.parse(
    localStorage.getItem("customLinksFilters") ?? "[]",
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  if (Object.keys(customDataTypeFilters).length > 0) {
    setFilterDataTypes((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      customDataTypeFilters.custom = true;
      const newComboboxItems = [
        ...prev[0].comboboxItems,
        customDataTypeFilters,
      ];
      return [
        {
          name: prev[0].name,
          comboboxItems: newComboboxItems,
        },
      ];
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  if (Object.keys(customLinkFilters).length > 0) {
    setFilterLinks((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      customLinkFilters.custom = true;
      const newComboboxItems = [...prev[0].comboboxItems, customLinkFilters];
      return [
        {
          name: prev[0].name,
          comboboxItems: newComboboxItems,
        },
      ];
    });
  }

  // eslint-disable-next-line solid/reactivity
  const initialDataTypeFilters = filterDataTypes().flatMap((section) =>
    section.comboboxItems.filter((item) =>
      // eslint-disable-next-line solid/reactivity
      props.filters.dataTypes.includes(item.name),
    ),
  );
  // eslint-disable-next-line solid/reactivity
  const initialLinkFilters = filterLinks().flatMap((section) =>
    section.comboboxItems.filter((item) =>
      // eslint-disable-next-line solid/reactivity
      props.filters.links.includes(item.name),
    ),
  );
  const [selectedDataTypeComboboxItems, setDataTypeSelectedComboboxItems] =
    createSignal<ComboboxItem[]>(initialDataTypeFilters);
  const [selectedLinkComboboxItems, setLinkSelectedComboboxItems] =
    createSignal<ComboboxItem[]>(initialLinkFilters);
  const [feelingLuckyText, setFeelingLuckyText] = createSignal(feelingSuffixes);
  const [feelingLuckySpinning, setFeelingLuckySpinning] = createSignal(false);

  const resizeTextarea = (
    textarea: HTMLTextAreaElement | null,
    avoidSetInput: boolean | undefined,
  ) => {
    if (!textarea) return;

    textarea.style.height = `${textarea.scrollHeight}px`;
    if (avoidSetInput) return;
    setTextareaInput(textarea.value);
    setTextareaInput(textarea.value);
  };

  const onSubmit = (e: Event) => {
    e.preventDefault();
    const textAreaValue = textareaInput();
    if (!textAreaValue) return;
    const searchQuery = encodeURIComponent(
      textAreaValue.length > 3800
        ? textAreaValue.slice(0, 3800)
        : textAreaValue,
    );
    const dataTypeFilters = encodeURIComponent(
      selectedDataTypeComboboxItems()
        .map((item) => item.name)
        .join(","),
    );
    const linkFilters = encodeURIComponent(
      selectedLinkComboboxItems()
        .map((item) => item.name)
        .join(","),
    );

    window.location.href = props.collectionID
      ? `/collection/${props.collectionID}?q=${searchQuery}` +
        (dataTypeFilters ? `&datatypes=${dataTypeFilters}` : "") +
        (linkFilters ? `&links=${linkFilters}` : "") +
        (searchTypes()[0].isSelected ? `&searchType=fulltextsearch` : "")
      : `/search?q=${searchQuery}` +
        (dataTypeFilters ? `&datatypes=${dataTypeFilters}` : "") +
        (linkFilters ? `&links=${linkFilters}` : "") +
        (searchTypes()[0].isSelected ? `&searchType=fulltextsearch` : "");
  };

  createEffect(() => {
    resizeTextarea(
      document.getElementById(
        "search-query-textarea",
      ) as HTMLTextAreaElement | null,
      false,
    );
    setSearchTypes((prev) => {
      return prev.map((item) => {
        if (props.searchType == item.route) {
          return { ...item, isSelected: true };
        } else {
          return { ...item, isSelected: false };
        }
      });
    });
  });

  createEffect(() => {
    const shouldNotRun = textareaInput() || textareaFocused();

    if (shouldNotRun) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const textArray: string[] = import.meta.env.PUBLIC_SEARCH_QUERIES.split(
      ",",
    );

    const typingSpeed = 50;
    const deleteSpeed = 30;

    let currentTextIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;

    let timeoutRefOne: number;
    let timeoutRefTwo: number;
    let timeoutRefThree: number;

    const typeText = () => {
      const currentText = textArray[currentTextIndex];

      if (isDeleting) {
        setTypewriterEffect(currentText.substring(0, currentCharIndex - 1));
        currentCharIndex--;
      } else {
        setTypewriterEffect(currentText.substring(0, currentCharIndex + 1));
        currentCharIndex++;
      }

      if (!isDeleting && currentCharIndex === currentText.length) {
        isDeleting = true;
        timeoutRefOne = setTimeout(typeText, 1000);
      } else if (isDeleting && currentCharIndex === 0) {
        isDeleting = false;
        currentTextIndex = (currentTextIndex + 1) % textArray.length;
        timeoutRefTwo = setTimeout(typeText, typingSpeed);
      } else {
        const speed = isDeleting ? deleteSpeed : typingSpeed;
        timeoutRefThree = setTimeout(typeText, speed);
      }
    };

    typeText();

    onCleanup(() => {
      clearTimeout(timeoutRefOne);
      clearTimeout(timeoutRefTwo);
      clearTimeout(timeoutRefThree);
    });
  });

  // contains the logic for the feeling lucky button
  createEffect(() => {
    let hoverTimeout = 0;

    const feelingRandom = () => {
      setFeelingLuckyText((prev) => {
        const arr = prev.slice();
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        if (arr[arr.length - 1] === prev[prev.length - 1]) {
          [arr[arr.length - 1], arr[0]] = [arr[0], arr[arr.length - 1]];
        }
        return arr;
      });

      hoverTimeout = setTimeout(() => {
        setFeelingLuckySpinning(false);
        hoverTimeout = 0;
      }, 300);
    };

    const feelingLucky = () => {
      clearTimeout(hoverTimeout);
      hoverTimeout = 0;
      setFeelingLuckySpinning(false);
    };

    const spinning = feelingLuckySpinning();
    if (spinning) {
      if (hoverTimeout) {
        return;
      }
      feelingRandom();
      return;
    }
    feelingLucky();
  });

  return (
    <div class="w-full">
      <form class="w-full space-y-4 dark:text-white" onSubmit={onSubmit}>
        <div class="flex space-x-2">
          <div class="flex w-full justify-center space-x-2 rounded-md bg-neutral-100 px-4 py-1 pr-[10px] dark:bg-neutral-700 ">
            <BiRegularSearch class="mt-1 h-6 w-6 fill-current" />
            <textarea
              id="search-query-textarea"
              classList={{
                "scrollbar-track-rounded-md scrollbar-thumb-rounded-md mr-2 h-fit max-h-[240px] w-full resize-none whitespace-pre-wrap bg-transparent py-1 scrollbar-thin scrollbar-track-neutral-200 scrollbar-thumb-neutral-400 focus:outline-none dark:bg-neutral-700 dark:text-white dark:scrollbar-track-neutral-700 dark:scrollbar-thumb-neutral-600":
                  true,
                "text-neutral-600": !textareaInput() && !textareaFocused(),
              }}
              onFocus={() => setTextareaFocused(true)}
              onBlur={() => setTextareaFocused(false)}
              value={
                textareaInput() ||
                (textareaFocused() ? textareaInput() : typewriterEffect())
              }
              onInput={(e) => resizeTextarea(e.target, false)}
              onKeyDown={(e) => {
                if (
                  ((e.ctrlKey || e.metaKey) && e.key === "Enter") ||
                  (!e.shiftKey && e.key === "Enter")
                ) {
                  onSubmit(e);
                }
              }}
              rows="1"
            />
            <Show when={textareaInput()}>
              <button
                classList={{
                  "pt-[2px]": !!props.query,
                }}
                onClick={(e) => {
                  e.preventDefault();
                  setTextareaInput("");
                  resizeTextarea(
                    document.getElementById(
                      "search-query-textarea",
                    ) as HTMLTextAreaElement,
                    true,
                  );
                }}
              >
                <BiRegularX class="h-7 w-7 fill-current" />
              </button>
            </Show>
            <Show when={props.query}>
              <button
                classList={{
                  "border-l border-neutral-600 pl-[10px] dark:border-neutral-200":
                    !!textareaInput(),
                }}
                type="submit"
              >
                <BiRegularSearch class="mt-1 h-6 w-6 fill-current" />
              </button>
            </Show>
          </div>
        </div>
        <div class="flex space-x-2">
          <Show
            when={
              filterDataTypes()[0].comboboxItems.length > 0 ||
              filterLinks()[0].comboboxItems.length > 0
            }
          >
            <Popover defaultOpen={false} class="relative">
              {({ isOpen, setState }) => (
                <>
                  <PopoverButton
                    aria-label="Toggle filters"
                    type="button"
                    class="flex items-center space-x-1 text-sm "
                  >
                    <span>Filters</span>{" "}
                    <svg
                      fill="currentColor"
                      stroke-width="0"
                      style={{ overflow: "visible", color: "currentColor" }}
                      viewBox="0 0 16 16"
                      class="h-3.5 w-3.5 "
                      height="1em"
                      width="1em"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M2 5.56L2.413 5h11.194l.393.54L8.373 11h-.827L2 5.56z" />
                    </svg>
                  </PopoverButton>
                  <Transition
                    show={isOpen()}
                    enter="transition duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <PopoverPanel
                      unmount={false}
                      class="absolute z-10 mt-2 h-fit w-fit rounded-md bg-neutral-200 p-1 shadow-lg dark:bg-neutral-800"
                    >
                      <Menu class="h-0">
                        <MenuItem class="h-0" as="button" aria-label="Empty" />
                      </Menu>
                      <div class="flex w-full min-w-full space-x-2">
                        <Show
                          when={
                            !props.collectionID &&
                            filterDataTypes()[0].comboboxItems.length > 0
                          }
                        >
                          <Combobox
                            selectedComboboxItems={
                              selectedDataTypeComboboxItems
                            }
                            setSelectedComboboxItems={
                              setDataTypeSelectedComboboxItems
                            }
                            comboboxSections={filterDataTypes}
                            setComboboxSections={setFilterDataTypes}
                            setPopoverOpen={setState}
                          />
                        </Show>
                        <Show when={filterLinks()[0].comboboxItems.length > 0}>
                          <Combobox
                            selectedComboboxItems={selectedLinkComboboxItems}
                            setSelectedComboboxItems={
                              setLinkSelectedComboboxItems
                            }
                            comboboxSections={filterLinks}
                            setComboboxSections={setFilterLinks}
                            setPopoverOpen={setState}
                          />
                        </Show>
                      </div>
                    </PopoverPanel>
                  </Transition>
                </>
              )}
            </Popover>
          </Show>
          <Popover defaultOpen={false} class="relative">
            {({ isOpen, setState }) => (
              <>
                <PopoverButton
                  aria-label="Toggle filters"
                  type="button"
                  class="flex items-center space-x-1 text-sm"
                >
                  <span>Search Type</span>{" "}
                  <svg
                    fill="currentColor"
                    stroke-width="0"
                    style={{ overflow: "visible", color: "currentColor" }}
                    viewBox="0 0 16 16"
                    class="h-3.5 w-3.5 "
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M2 5.56L2.413 5h11.194l.393.54L8.373 11h-.827L2 5.56z" />
                  </svg>
                </PopoverButton>
                <Transition
                  show={isOpen()}
                  enter="transition duration-200"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="transition duration-150"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <PopoverPanel
                    unmount={false}
                    class="absolute z-10 mt-2 h-fit w-[180px]  rounded-md bg-neutral-200 p-1 shadow-lg dark:bg-neutral-800"
                  >
                    <Menu class="ml-1 space-y-1">
                      <For each={searchTypes()}>
                        {(option) => {
                          const onClick = (e: Event) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSearchTypes((prev) => {
                              return prev.map((item) => {
                                if (item.name === option.name) {
                                  return { ...item, isSelected: true };
                                } else {
                                  return { ...item, isSelected: false };
                                }
                              });
                            });
                            setState(true);
                          };
                          return (
                            <MenuItem
                              as="button"
                              classList={{
                                "flex w-full items-center justify-between rounded p-1 focus:text-black focus:outline-none dark:hover:text-white dark:focus:text-white":
                                  true,
                                "bg-neutral-300 dark:bg-neutral-900":
                                  option.isSelected,
                              }}
                              onClick={onClick}
                            >
                              <div class="flex flex-row justify-start space-x-2">
                                <span class="text-left">{option.name}</span>
                              </div>
                              {option.isSelected && (
                                <span>
                                  <FaSolidCheck class="fill-current text-xl" />
                                </span>
                              )}
                            </MenuItem>
                          );
                        }}
                      </For>
                    </Menu>
                  </PopoverPanel>
                </Transition>
              </>
            )}
          </Popover>
        </div>
        <Show when={!props.query && !props.collectionID}>
          <div class="flex justify-center space-x-4 sm:gap-y-0 sm:space-x-2 sm:px-6">
            <button
              class="w-fit rounded bg-neutral-100 p-2 text-center hover:bg-neutral-100 dark:bg-neutral-700"
              type="submit"
            >
              Search for Evidence
            </button>
            <Show when={createEvidenceFeature}>
              <a
                class="w-fit rounded bg-neutral-100 p-2 text-center hover:bg-neutral-100 dark:bg-neutral-700"
                href="/create"
              >
                Create Evidence Card
              </a>
            </Show>
            <a
              class="relative hidden h-[40px] overflow-hidden rounded bg-neutral-100 p-2 text-center transition-width duration-1000 hover:bg-neutral-100 dark:bg-neutral-700 sm:block"
              href={`/search?q=I'm feeling ${
                feelingLuckyText().findLast(() => true) ?? ""
              }`}
              onMouseEnter={() => {
                setFeelingLuckySpinning(true);
              }}
              onMouseLeave={() => {
                setFeelingLuckySpinning(false);
              }}
            >
              <Show when={feelingLuckySpinning()}>
                <span class="block h-[40px] animate-scrollup overflow-hidden">
                  <For each={feelingLuckyText()}>
                    {(text) => <p>I'm Feeling {text}</p>}
                  </For>
                </span>
              </Show>
              <Show when={!feelingLuckySpinning()}>
                <span>
                  I'm Feeling {feelingLuckyText().findLast(() => true)}
                </span>
              </Show>
            </a>
          </div>
        </Show>
      </form>
    </div>
  );
};

export default SearchForm;
