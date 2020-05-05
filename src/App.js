import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { Multiselect } from 'multiselect-react-dropdown';

import Loader from 'react-loader-spinner'
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css"

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import './App.css';

class App extends Component {
  constructor() {
    super();

    const date = new Date();

    this.state = {
      fetching: false,
      freelancers: [],
      currentFreelancers: [],
      online_only: true,
      countries: [],
      selectedCountries: [{ name: "United States", id: 236 }],
      minRate: 2,
      maxRate: 80,
      minSequence: 0,
      count: 100,
      startDate: new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1),
      endDate: new Date(date)
    };
  }

  getCountries = async () => {
    const resp = await fetch("https://www.freelancer.com/api/common/0.1/countries");
    const countries = await resp.json();
    this.setState({ countries: countries.result.countries.map(country => country.name) })
  }

  componentDidMount() {
    this.getCountries().then(() => this.fetchFreelancers(0, 100));
  }

  fetch = async () => {
    this.setState({ freelancers: [], fetching: true }, () => {
      for (let i = 0; i < 50; i += 1) {
        this.fetchFreelancers(100 * i, 100)
      }
    })
  }

  fetchFreelancers = async (minSequence, limit) => {
    const { online_only, selectedCountries, startDate, endDate } = this.state;

    console.log(`Fetching from ${minSequence}th ${limit} freelancers`);
    try {
      let url = `https://www.freelancer.com/api/users/0.1/users/directory?avatar=false&offset=${minSequence}&limit=${limit}${online_only ? "&online_only=true" : ""}&${selectedCountries.map(country => `countries[]=${country.name}`).join('&')}`;

      const res = await fetch(url);
      const { result } = await res.json();
      console.log(result)

      const { freelancers } = this.state;
      if (result.users.length > 0) {
        const newFreelancers = freelancers.slice(0);
        newFreelancers.push(...result.users.filter((freelancer) => {
          const exists = freelancers.filter((fl) => fl.username === freelancer.username).length > 0;
          return !exists && freelancer.registration_date >= startDate.getTime() / 1000 && freelancer.registration_date <= endDate.getTime() / 1000;
        }).map((freelancer) => {
          const newFreelancer = { ...freelancer };
          newFreelancer.profile_viewed = false;
          newFreelancer.profile_deleted = false;
          return newFreelancer;
        }));
        this.setState({ freelancers: newFreelancers }, () => this.fetchFreelancers(minSequence + limit * 50, limit));
      } else {
        setTimeout(() => this.setState({ fetching: false }), 4000)
        console.clear();
      }
    } catch {
    }
  }

  viewFreelancerProfile = (index) => {
    const { freelancers } = this.state;
    const freelancer = freelancers[index];
    const { username } = freelancer;
    window.open(`https://www.freelancer.com/u/${username}`);
    freelancers[index].profile_viewed = true;
    this.setState({ freelancers });
  }

  removeFreelancer = (index) => {
    const { freelancers } = this.state;
    freelancers[index].profile_deleted = true;
    this.setState({ freelancers });
  }

  renderFreelancer = (freelancer, index) => {
    const { username, registration_date, profile_viewed, profile_deleted, location, avatar_cdn } = freelancer;
    const date = new Date(registration_date * 1000);
    if (profile_deleted) return null;
    return (
      <div key={index} className={`freelancer ${!profile_viewed ? 'new' : ''}`}>
        <div className="info-panel">
          <div className="info-group">
            <div className="info-avatar">
              <img src={avatar_cdn} alt="Avatar" />
            </div>
            <div className="info-detail">
              <div className="info-detail--item">
                <label>Name: </label>
                <span>{username}</span>
              </div>
              <div className="info-detail--item">
                <label>Country: </label>
                <span>{location && location.country.name}</span>
              </div>
              <div className="info-detail--item">
                <label>Date: </label>
                <span>{date.getFullYear()}-{date.getMonth() + 1}-{date.getDate()}</span>
              </div>
            </div>
          </div>
          <a href={`https://www.freelancer.com/u/${username}`} > View Profile </a>
          {/* <button className="info-btn" onClick={() => this.viewFreelancerProfile(index)}>View Profile</button> */}
          <button className="info-btn" onClick={() => this.removeFreelancer(index)}>Remove Freelancer</button>
        </div>
      </div>
    )
  }

  onSelectCountry = (selectedList) => {
    this.setState({ selectedCountries: selectedList })
  }

  onRemoveCountry = (selectedList) => {
    this.setState({ selectedCountries: selectedList })
  }

  render() {
    const { freelancers, online_only, countries, selectedCountries, minRate, maxRate, startDate, endDate, minSequence, count, fetching } = this.state;
    const sort = (a, b) => a.registration_date - b.registration_date;

    return (
      <div className="App">
        <div>
          <input name="online_only" type="checkbox" checked={online_only} onChange={e => this.setState({ online_only: e.target.checked })} style={{ marginBottom: 10 }} />
          <label htmlFor="online_only">Online Freelancers Only</label>

          <div style={{ display: 'flex' }}>
            <div style={{ flex: 'auto' }}>
              <Multiselect
                placeholder="Select Countries"
                options={countries.map((country, index) => ({ name: country, id: index }))} // Options to display in the dropdown
                selectedValues={selectedCountries} // Preselected value to persist in dropdown
                onSelect={this.onSelectCountry} // Function will trigger on select event
                onRemove={this.onRemoveCountry} // Function will trigger on remove event
                displayValue="name" // Property name to display in the dropdown options
              />
              {/* <div style={{ marginTop: 50 }}>
              <label style={{ marginRight: 10 }}>Hourly Rate</label>
              <input type="number" style={{ width: 50, marginRight: 10 }} min={2} max={80} value={minRate} onChange={e => this.setState({ minRate: e.target.value })} />
              <input type="number" style={{ width: 50, marginRight: 10 }} min={2} max={80} value={maxRate} onChange={e => this.setState({ maxRate: e.target.value })} />
            </div> */}
            </div>

            <div style={{ flex: 'auto' }}>
              <label style={{ marginBottom: 10 }}>Joined Date Range</label>
              <DatePicker
                selected={startDate}
                onChange={date => { this.setState({ startDate: date }) }}
                style={{ marginRight: 10 }}
              />
              <DatePicker
                selected={endDate}
                onChange={date => { this.setState({ endDate: date }) }}
              />
            </div>
          </div>

          <button style={{ marginTop: 10, display: 'block' }} onClick={this.fetch}>Fetch Freelancers</button>
          {fetching && <Loader
            type="Puff"
            color="#00BFFF"
            height={100}
            width={100}
          />}
        </div>

        <h3>There are {freelancers.filter((freelancer) => !freelancer.profile_deleted).length} freelancers.</h3>
        <div style={{ marginTop: 10 }}>
          <label style={{ marginRight: 10 }}>From</label>
          <input type="number" style={{ width: 100, marginRight: 10 }} min={0} value={minSequence} onChange={e => this.setState({ minSequence: parseInt(e.target.value) })} />
          <label style={{ marginRight: 10 }}>Count: </label>
          <input type="number" style={{ width: 100, marginRight: 10 }} min={0} max={100} value={count} onChange={e => this.setState({ count: parseInt(e.target.value) })} />
        </div>

        <div >
          {
            freelancers.slice(minSequence, minSequence + count).map((freelancer, index) => this.renderFreelancer(freelancer, index))
          }
        </div>
      </div>
    );
  }
}

export default withRouter(App);
