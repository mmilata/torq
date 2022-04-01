import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import {
  ArrowSortDownLines20Regular as SortIcon,
  Dismiss20Regular as DismissIcon,
  ReOrder16Regular as ReOrderIcon,
  AddSquare20Regular as AddIcon,
} from "@fluentui/react-icons";
import TorqSelect from "../../../inputs/Select";
import DefaultButton from "../../../buttons/Button";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import {selectAllColumns, selectSortBy, updateSortBy,} from "../../tableSlice";
import Popover from '../../../popover/Popover';
// TODO: Convert to styled components using imported scss
import './sort.scss'

export interface SortByOptionType {
  value: string;
  label: string;
  direction: string;
}

interface sortRowInterface {
  selected: SortByOptionType;
  options: SortByOptionType[];
  index: number;
  handleUpdateSort: Function;
  handleRemoveSort: Function;
}
interface sortDirectionOption {
  value: string;
  label: string;
}
const sortDirectionOptions: sortDirectionOption[] = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" }
];

const SortRow = ({selected, options, index, handleUpdateSort, handleRemoveSort}: sortRowInterface ) => {

  const handleColumn = (item: SortByOptionType) => {
    handleUpdateSort(item, index)
  }
  const handleDirection = (item: {value: string, label: string}) => {
    handleUpdateSort({
      ...selected,
      direction: item.value
    }, index)
  }

  return (
    <div className={"sort-row"}>
      <ReOrderIcon />
      <div style={{ flex: 3 }}>
        <TorqSelect
          onChange={handleColumn}
          options={options}
          getOptionLabel={(option: { [x: string]: any }) =>
            option['label']
          }
          getOptionValue={(option: { [x: string]: any }) =>
            option['value']
          }
          value={selected}
        />
      </div>

      <div style={{ flex: 2 }}>
        <TorqSelect
          onChange={handleDirection}
          options={sortDirectionOptions}
          getOptionLabel={(option: { [x: string]: any }) =>
            option['label']
          }
          getOptionValue={(option: { [x: string]: any }) =>
            option['value']
          }
          value={sortDirectionOptions.find(
            (dir: sortDirectionOption) => dir.value === selected.direction)
          }
        />
      </div>
      <DismissIcon onClick={(() => {handleRemoveSort(index)})} />
    </div>
  );
};

const SortControls = () => {

  const dispatch = useAppDispatch();
  const columns = useAppSelector(selectAllColumns);
  const sorts = useAppSelector(selectSortBy);

  let options = columns
    .slice()
    .map((column: { key: string; heading: string; valueType: string }) => {
      return {
        value: column.key,
        label: column.heading,
        direction: 'desc'
      };
    });


  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleAddSort = () => {
    const updated: SortByOptionType[] = [
      ...sorts,
      {
        direction: '',
        value: columns[0].key,
        label: columns[0].heading,
      }
    ]
    dispatch(updateSortBy({sortBy: updated}))
  };

  const handleUpdateSort = (update: SortByOptionType, index: number) => {
    const updated: SortByOptionType[] = [
      ...sorts.slice(0, index),
      update,
      ...sorts.slice(index + 1, sorts.length),
    ]
    dispatch(updateSortBy({sortBy: updated}))
  };

  const handleRemoveSort = (index: number) => {
    const updated: SortByOptionType[] = [
      ...sorts.slice(0, index),
      ...sorts.slice(index + 1, sorts.length),
    ]
    dispatch(updateSortBy({sortBy: updated}))
  };

  const buttonText = (): string => {
    if (sorts.length > 0) {
      return sorts.length + " Sorted";
    }
    return "Sort";
  };

  let popOverButton = <DefaultButton
          isOpen={!!sorts.length}
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          icon={<SortIcon />}
          text={buttonText()}
          className={"collapse-tablet"}
        />

  return (
    <div>
      <Popover button={popOverButton}>
        <div className={"sort-popover-content"}>

          {!sorts.length && <div className={"no-filters"}>No sorting</div>}

          {!!sorts.length && (<div className={"sort-rows"}>
            {sorts.map((item, index) => {
              return (
                <SortRow
                  key={item.value + index}
                  selected={item}
                  options={options}
                  index={index}
                  handleUpdateSort={handleUpdateSort}
                  handleRemoveSort={handleRemoveSort}
                />
              );
            })}
          </div>)}

          <div className="buttons-row">
            <DefaultButton onClick={() => handleAddSort()} text={"Add Sort"} icon={<AddIcon/>}/>
          </div>

        </div>
      </Popover>
    </div>
  );
};

export default SortControls;
