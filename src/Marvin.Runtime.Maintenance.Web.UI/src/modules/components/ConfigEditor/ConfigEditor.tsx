import { faArrowsAltV, faFolderOpen } from "@fortawesome/fontawesome-free-solid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as React from "react";
import { Button, ButtonGroup, Card, CardBody, CardHeader, Col, Container, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Input, Row, Table } from "reactstrap";
import Entry from "../../models/Entry";
import { EntryValueType, toString } from "../../models/EntryValueType";
import BooleanEditor from "./BooleanEditor";
import ByteEditor from "./ByteEditor";
import ClassEditor from "./ClassEditor";
import CollectionEditor from "./CollectionEditor";
import EnumEditor from "./EnumEditor";
import NumberEditor from "./NumberEditor";
import StringEditor from "./StringEditor";

interface ConfigEditorPropModel {
    ParentEntry: Entry;
    Entries: Entry[];
    IsReadOnly: boolean;
    RootEntries: Entry[];
    navigateToEntry(entry: Entry): void;
}

interface ConfigEditorStateModel {
    ExpandedEntryNames: string[];
    SelectedEntryType: string;
}

export default class ConfigEditor extends React.Component<ConfigEditorPropModel, ConfigEditorStateModel> {
    private static divider: number = 2;

    constructor(props: ConfigEditorPropModel) {
        super(props);
        this.state = {
            ExpandedEntryNames: [],
            SelectedEntryType: this.props.ParentEntry != null ? this.props.ParentEntry.Value.Current : ""
        };
    }

    public componentWillReceiveProps(nextProps: ConfigEditorPropModel): void {
        if (this.state.SelectedEntryType === "" && this.props.ParentEntry != null) {
            this.setState({ SelectedEntryType: this.props.ParentEntry.Value.Current});
        }
    }

    private toggleCollapsible(entryName: string): void {
        if (this.isExpanded(entryName)) {
            this.setState((prevState) => ({ ExpandedEntryNames: prevState.ExpandedEntryNames.filter((name) => name !== entryName) }));
        } else {
            this.setState((prevState) => ({ ExpandedEntryNames: [...prevState.ExpandedEntryNames, entryName] }));
        }
    }

    private isExpanded(entryName: string): boolean {
        return this.state.ExpandedEntryNames.find((e: string) => e === entryName) != undefined;
    }

    private static isEntryTypeSettable(entry: Entry): boolean {
        if (entry === null || entry === undefined || entry.Parent === null || entry.Parent === undefined) {
            return false;
        }

        return entry.Value.Type === EntryValueType.Class &&
               entry.Parent.Value.Type !== EntryValueType.Collection &&
               entry.Value.Possible != null &&
               entry.Value.Possible.length > 1;
    }

    private onEntryTypeChange(e: React.FormEvent<HTMLInputElement>): void {
        this.setState({SelectedEntryType: e.currentTarget.value});
    }

    private onPatchToSelectedEntryType(): void {
        let prototype: Entry = null;
        let entryType: EntryValueType = EntryValueType.Class;
        if (this.props.ParentEntry.Parent != null) {
            entryType = this.props.ParentEntry.Parent.Value.Type;
        }

        switch (entryType) {
            case EntryValueType.Class:
                prototype = this.props.ParentEntry.Prototypes.find((proto: Entry) => proto.Key.Name === this.state.SelectedEntryType);
        }

        const clone = Entry.cloneFromPrototype(prototype, this.props.ParentEntry.Parent);

        let subEntries: Entry[] = this.props.RootEntries;
        if (this.props.ParentEntry.Parent != null) {
            subEntries = this.props.ParentEntry.Parent.SubEntries;
        }

        const idx = subEntries.indexOf(this.props.ParentEntry);
        if (idx !== -1) {
            subEntries[idx] = clone;
            this.setState({SelectedEntryType: this.props.ParentEntry.Value.Current});
            this.props.navigateToEntry(this.props.ParentEntry);
        }
    }

    public selectPropertyByType(entry: Entry): React.ReactNode {
        switch (entry.Value.Type) {
            case EntryValueType.Byte:
            {
                return (<ByteEditor Entry={entry} IsReadOnly={this.props.IsReadOnly} />);
            }
            case EntryValueType.Boolean:
            {
                return (<BooleanEditor Entry={entry} IsReadOnly={this.props.IsReadOnly} />);
            }
            case EntryValueType.Int16:
            case EntryValueType.UInt16:
            case EntryValueType.Int32:
            case EntryValueType.UInt32:
            case EntryValueType.Int64:
            case EntryValueType.UInt64:
            case EntryValueType.Single:
            case EntryValueType.Double:
            {
                return (<NumberEditor Entry={entry} IsReadOnly={this.props.IsReadOnly} />);
            }
            case EntryValueType.String:
            {
                return (<StringEditor Entry={entry} IsReadOnly={this.props.IsReadOnly} />);
            }
            case EntryValueType.Enum:
            {
                return (<EnumEditor Entry={entry} IsReadOnly={this.props.IsReadOnly} />);
            }
            case EntryValueType.Collection:
            case EntryValueType.Class:
            {
                return (
                    <ButtonGroup>
                        <Button color="secondary" onClick={() => this.props.navigateToEntry(entry)}>
                            <FontAwesomeIcon icon={faFolderOpen} className="right-space" />
                            Open
                        </Button>
                        <Button color="secondary" onClick={() => this.toggleCollapsible(entry.Key.UniqueIdentifier)}>
                            <FontAwesomeIcon icon={faArrowsAltV} className="right-space" />
                            {this.isExpanded(entry.Key.UniqueIdentifier) ? "Collapse" : "Expand"}
                        </Button>
                    </ButtonGroup>
                );
            }
        }

        return (<span>Not implemented yet: {toString(entry.Value.Type)}</span>);
    }

    public preRenderEntries(entries: Entry[]): React.ReactNode {
        return entries.map((subEntry, idx) =>
        (
            <div key={idx} className="table-row">
                <Row style={{padding: "5px 0px 5px 0px", alignItems: "center"}}>
                    <Col md={7} className="no-padding">
                        <Container fluid={true}>
                            <Row>
                                <Col md={12}><span className="font-bold align-self-center">{subEntry.Key.Name}</span></Col>
                            </Row>
                            <Row>
                                <Col md={12}><span className="font-disabled">{subEntry.Description}</span></Col>
                            </Row>
                        </Container>
                    </Col>
                    <Col md={5}>
                    {
                        this.selectPropertyByType(subEntry)
                    }
                    </Col>
                </Row>
                { subEntry.Value.Type === EntryValueType.Collection &&
                    (
                        <Row>
                            <Col md={12}>
                                <CollectionEditor Entry={subEntry}
                                                  IsExpanded={this.isExpanded(subEntry.Key.UniqueIdentifier)}
                                                  RootEntries={this.props.RootEntries}
                                                  navigateToEntry={this.props.navigateToEntry}
                                                  IsReadOnly={this.props.IsReadOnly} />
                            </Col>
                        </Row>
                    )
                }
                { subEntry.Value.Type === EntryValueType.Class &&
                    (
                        <Row>
                            <Col md={12}>
                                <ClassEditor Entry={subEntry}
                                             IsExpanded={this.isExpanded(subEntry.Key.UniqueIdentifier)}
                                             RootEntries={this.props.RootEntries}
                                             navigateToEntry={this.props.navigateToEntry}
                                             IsReadOnly={this.props.IsReadOnly} />
                            </Col>
                        </Row>
                    )
                }
            </div>
        ));
    }

    public render(): React.ReactNode {
        let entries: any;
        if (this.props.ParentEntry != null && this.props.ParentEntry.Value.Type === EntryValueType.Collection) {
            entries = (
                <Row>
                    <Col md={12}>
                        <CollectionEditor Entry={this.props.ParentEntry}
                                          IsExpanded={true}
                                          RootEntries={this.props.RootEntries}
                                          navigateToEntry={this.props.navigateToEntry}
                                          IsReadOnly={this.props.IsReadOnly} />
                    </Col>
                </Row>
            );
        } else {
            entries = this.preRenderEntries(this.props.Entries);
        }

        return (
            <div className="config-editor">
                {entries}
                { ConfigEditor.isEntryTypeSettable(this.props.ParentEntry) &&
                    <Container fluid={true}
                               style={{margin: "10px 0px 10px 0px"}}
                               className="no-padding">
                        <Row style={{alignItems: "center"}}>
                            <Col md={4} className="no-padding">
                                <Input type="select" value={this.state.SelectedEntryType}
                                       onChange={(e: React.FormEvent<HTMLInputElement>) => this.onEntryTypeChange(e)}>
                                    {
                                        this.props.ParentEntry.Value.Possible.map((possibleValue, idx) => {
                                            return (<option key={idx}>{possibleValue}</option>);
                                        })
                                    }
                                </Input>
                            </Col>
                            <Col md={2}>
                                <Button color="primary"
                                        disabled={this.state.SelectedEntryType === "" || this.state.SelectedEntryType === this.props.ParentEntry.Value.Current}
                                        onClick={() => this.onPatchToSelectedEntryType()}>
                                    Set entry type
                                </Button>
                            </Col>
                        </Row>
                    </Container>
                }
            </div>
        );
    }
}